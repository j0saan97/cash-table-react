# Guía del proyecto — Cash Table (6-max No Limit Hold'em)

Documento de referencia para construir la app descrita en [objetivo.md](objetivo.md). Define qué se construye, cómo se divide y qué reglas no se negocian.

---

## 1. Alcance

**Objetivo:** app web para jugar mesas de cash de Texas Hold'em No Limit, 6 jugadores máximo, en tiempo real.

**Dentro del alcance (v1)**

- Registro y login con autenticación segura.
- Lobby con mesas agrupadas por nivel de ciegas.
- Mesa de juego 6-max NLHE en tiempo real, multijugador.
- Base de datos con usuarios, saldo, mesas e historial de manos.

**Fuera del alcance (v1)**

- Dinero real, pagos, KYC. Se juega con **fichas virtuales**.
- Torneos, Sit & Go, otras variantes (PLO, etc.).
- Chat, amigos, avatares personalizados, app móvil nativa.
- Rake (queda previsto en el modelo de datos, valor 0).

> **Decidido:** se juega con fichas ficticias, sin dinero real.

---

## 2. Principios de arquitectura

1. **El servidor es la única autoridad.** El cliente solo envía intenciones ("subo a 300") y pinta el estado que recibe. Nunca decide quién gana, qué carta sale ni cuánto hay en el bote.
2. **La lógica del juego es código puro.** El motor de póker no sabe que existe React, ni la red, ni la base de datos, ni el reloj. Entradas → salidas, sin efectos.
3. **La UI es tonta.** Los componentes reciben props y emiten eventos. No calculan reglas de póker ni hablan con el servidor directamente.
4. **Mínimas dependencias.** Antes de añadir un paquete: ¿lo resuelve la plataforma (Node / navegador)? ¿Son menos de ~100 líneas propias? Si sí, no se instala.
5. **Las fichas son enteros.** Nunca `float`. Todo movimiento de saldo queda registrado y es trazable.
6. **Información oculta nunca sale del servidor.** Las cartas de un rival no se envían al cliente hasta el showdown; el mazo, nunca.

---

## 3. Stack y dependencias

| Capa | Elección | Motivo |
|---|---|---|
| Lenguaje | TypeScript (strict) en todo | Tipos compartidos entre cliente, servidor y motor |
| Cliente | React + Vite | Requisito; Vite solo en desarrollo/build |
| Estilos | CSS plano, un `.css` por componente + variables CSS | Sin librería de UI ni CSS-in-JS |
| Estado cliente | `useReducer` + `useSyncExternalStore` | Sin Redux/Zustand: el estado real vive en el servidor |
| Rutas cliente | Router propio mínimo (History API) | Son 4 pantallas |
| Servidor | Node.js LTS, `node:http` | Pocas rutas REST; no hace falta framework |
| Tiempo real | WebSocket con `ws` | Nativo en navegador; `ws` es pequeño y sin dependencias |
| Base de datos | PostgreSQL con `pg` | Transacciones ACID para saldo; SQL directo, sin ORM |
| Migraciones | Ficheros `.sql` numerados + script propio | Sin herramienta externa |
| Hash de contraseñas | `crypto.scrypt` (nativo de Node) | Sin dependencia nativa que compilar |
| Aleatoriedad | `crypto.randomInt` (nativo) | CSPRNG para barajar |
| Tests | `node:test` + `node:assert` | Nativo |
| Catálogo de componentes | Storybook (solo dev) | Desarrollar la mesa sin levantar servidor |

**Dependencias de producción previstas:** `react`, `react-dom` (cliente); `ws`, `pg` (servidor). El motor: **cero**.

---

## 4. Estructura del repositorio

Monorepo con npm workspaces. La regla de dependencias es de un solo sentido.

```
cash-table-react/
├─ packages/
│  ├─ engine/          # Motor de póker. TS puro, 0 dependencias.
│  └─ protocol/        # Tipos y validadores de mensajes cliente↔servidor.
├─ apps/
│  ├─ server/          # HTTP + WebSocket + PostgreSQL.
│  └─ web/             # React.
├─ db/
│  └─ migrations/      # 001_init.sql, 002_...
├─ objetivo.md
└─ guia-proyecto.md
```

```
engine   ← no importa nada
protocol ← importa engine (solo tipos)
server   ← importa engine + protocol
web      ← importa protocol (+ tipos de engine)
```

`web` **no** ejecuta el motor para decidir nada; como mucho reutiliza funciones puras de ayuda (p. ej. "rango de subida legal") para pintar el slider, y el servidor valida igualmente.

---

## 5. Motor de juego (`packages/engine`)

### 5.1 Forma

Una máquina de estados pura:

```ts
applyAction(state: HandState, action: Action): { state: HandState; events: GameEvent[] }
```

- Sin `Date.now()`, sin `Math.random()`, sin I/O. El mazo ya barajado y los tiempos entran como datos.
- `events` describe lo ocurrido (`BlindsPosted`, `CardsDealt`, `PlayerActed`, `StreetAdvanced`, `PotAwarded`…). El servidor los persiste y los retransmite; el cliente los anima.
- Mismo estado inicial + mismas acciones = mismo resultado. Esto permite **reproducir cualquier mano** desde el historial para depurar o resolver disputas.

### 5.2 Módulos

| Módulo | Responsabilidad |
|---|---|
| `cards` | Representación de cartas y mazo; barajado Fisher-Yates recibiendo el generador aleatorio por parámetro |
| `evaluator` | Mejor mano de 5 entre 7 cartas, comparación y desempates |
| `betting` | Acciones legales, mínimos de subida, cierre de ronda |
| `pots` | Bote principal y botes secundarios |
| `hand` | Ciclo de una mano: ciegas → preflop → flop → turn → river → showdown |
| `table` | Asientos, botón, ciegas entre manos, entradas y salidas |

### 5.3 Reglas que hay que cubrir (y testear)

**Apuestas**
- Acciones: fold, check, call, bet, raise, all-in.
- Subida mínima = tamaño de la última apuesta o subida completa.
- All-in por menos de una subida completa **no reabre** la acción a quien ya actuó.
- La ronda se cierra cuando todos los activos han igualado o están all-in.
- Si solo queda un jugador con fichas por actuar frente a all-ins, se reparten las calles restantes sin más apuestas.

**Botes**
- Botes secundarios con varios all-in de distinto tamaño.
- Apuesta no igualada se devuelve.
- Bote dividido; la ficha impar va al primer jugador a la izquierda del botón.
- Gana sin showdown quien se queda solo; no enseña cartas.

**Mesa**
- Movimiento de botón y ciegas, incluido el caso de jugador que se levanta entre manos.
- Jugador nuevo: espera a la ciega grande o la paga para entrar (decidir una; recomendado *esperar a la BB* por simplicidad).
- Mínimo 5 jugadores para repartir.
- Buy-in entre 40 y 100 ciegas grandes; recompra solo entre manos y hasta el máximo.
- Sit-out: no recibe cartas; tras 10 manos ausente se le levanta.
- Orden de showdown: primero el último agresor; los perdedores pueden no mostrar.

**Tiempo**
- El motor no tiene reloj. El servidor arranca un temporizador por turno y, al expirar, inyecta la acción `Timeout` → check si es posible, si no fold.

### 5.4 Tests

El motor es la pieza más crítica y la más fácil de testear: cobertura alta, sin mocks.

- Tabla de casos para el evaluador (todas las categorías, kickers, empates, rueda A-2-3-4-5).
- Escenarios de botes secundarios con 3+ all-ins.
- Invariante en cada test: **fichas totales antes = fichas totales después**.
- Test de propiedades simple: miles de manos con acciones legales aleatorias, comprobando la invariante y que la mano siempre termina.

---

## 6. Servidor (`apps/server`)

### 6.1 Capas

```
transport/   HTTP (auth, lobby) y WebSocket (mesa)      → traduce y valida mensajes
services/    auth, lobby, wallet, table-manager         → casos de uso
tables/      un "actor" por mesa que envuelve el motor  → estado vivo en memoria
db/          repositorios con SQL                       → único sitio con consultas
```

`transport` no toca SQL; `db` no conoce WebSocket; `tables` no conoce HTTP.

### 6.2 Una mesa = un actor

- Cada mesa tiene su estado en memoria y una **cola de acciones procesada en serie**. Así no hay condiciones de carrera dentro de una mesa sin necesidad de locks.
- Flujo de una acción: validar sesión → validar forma del mensaje → encolar → `applyAction` → persistir eventos → emitir a cada jugador **su vista filtrada**.
- La vista filtrada se construye con una función única `viewFor(state, playerId)` que elimina cartas ajenas y el mazo. Es el único camino por el que sale estado hacia un cliente.

### 6.3 Fichas y consistencia

- El saldo del usuario vive en la base de datos. Al sentarse, el buy-in se **mueve** del saldo a la mesa en una transacción.
- Durante la mano, los stacks viven en memoria. Al terminar cada mano se persisten resultado y stacks en una sola transacción.
- Al levantarse, el stack vuelve al saldo en una transacción.
- Si el servidor cae a mitad de mano: al arrancar, las manos sin cerrar se **anulan** y cada jugador recupera el stack con el que empezó esa mano (guardado al inicio).

### 6.4 API

**HTTP (JSON)**

| Método | Ruta | Uso |
|---|---|---|
| POST | `/api/auth/register` | Alta |
| POST | `/api/auth/login` | Inicia sesión, fija cookie |
| POST | `/api/auth/logout` | Revoca sesión |
| GET | `/api/me` | Usuario y saldo |
| GET | `/api/lobby` | Niveles y mesas con ocupación |

**WebSocket** (`/ws`, autenticado con la misma cookie)

| Cliente → servidor | Servidor → cliente |
|---|---|
| `table.join` (observar) | `table.snapshot` (estado completo filtrado) |
| `table.sit` (asiento, buy-in) | `table.event` (evento incremental con nº de secuencia) |
| `table.action` (fold/check/call/bet/raise + importe) | `turn.start` (a quién le toca, fecha límite, acciones legales) |
| `table.sitOut` / `table.leave` | `error` (código + mensaje) |
| `table.rebuy` | `lobby.update` |

- Cada mensaje de mesa lleva `seq`. Si el cliente detecta un salto o se reconecta, pide `table.snapshot` y se resincroniza.
- `table.action` incluye el `handId` y el `seq` que el cliente vio, para descartar acciones tardías o duplicadas.

---

## 7. Autenticación y seguridad

**Registro / login**
- Email + nombre de usuario (únicos) + contraseña (mínimo 10 caracteres, sin reglas de composición absurdas).
- Hash con `scrypt`, sal aleatoria por usuario, parámetros guardados junto al hash para poder endurecerlos después.
- Comparación en tiempo constante (`crypto.timingSafeEqual`).
- Mensaje de error idéntico para "usuario no existe" y "contraseña incorrecta".

**Sesiones**
- Token opaco aleatorio de 32 bytes; en base de datos se guarda **solo su hash SHA-256**.
- Cookie `HttpOnly`, `Secure`, `SameSite=Lax`. Nada de tokens en `localStorage`.
- Caducidad con renovación deslizante; logout revoca en servidor.
- Se prefiere sesión en base de datos frente a JWT: revocable al instante y sin librería.

**Protecciones**
- Límite de intentos de login por IP y por cuenta (contador en memoria; en BD si hay varios procesos).
- Comprobación de cabecera `Origin` en peticiones que modifican y en el handshake de WebSocket.
- Validación de **todos** los mensajes entrantes con los validadores de `protocol`; tamaño máximo de mensaje y límite de mensajes por segundo por conexión.
- Consultas SQL siempre parametrizadas.
- HTTPS/WSS obligatorio en producción; secretos por variables de entorno.

**Integridad del juego**
- Barajado con CSPRNG en servidor.
- Una sesión solo puede ocupar un asiento por mesa.
- Registro completo de cada mano (apartado 8) para auditoría.

---

## 8. Base de datos (PostgreSQL)

```
users            id, email (único), username (único), password_hash, created_at
sessions         id, user_id → users, token_hash (único), expires_at, created_at
wallets          user_id → users (PK), balance BIGINT CHECK (balance >= 0)
ledger_entries   id, user_id → users, amount BIGINT (±), reason, table_id, created_at
stakes           id ('NL10'), small_blind, big_blind, min_buyin, max_buyin
tables           id, stake_id → stakes, name, max_seats (6), status
seats            table_id → tables, seat_no, user_id → users, stack BIGINT   -- PK (table_id, seat_no)
hands            id, table_id → tables, small_blind, big_blind, button_seat, deck, board, status, started_at, ended_at
hand_players     hand_id → hands, user_id → users, seat_no, start_stack, end_stack, hole_cards
hand_events      hand_id → hands, seq, type, payload JSONB                    -- PK (hand_id, seq)
```

**Reglas**

- **`ledger_entries` es solo de inserción.** Motivos: `signup_bonus`, `daily_refill`, `buy_in`, `cash_out`, `rebuy`. `wallets.balance` es un valor derivado que se actualiza en la misma transacción; debe poder recalcularse sumando el libro.
- Importes en `BIGINT`, en la unidad mínima de ficha.
- `CHECK (balance >= 0)` como última red de seguridad contra saldos negativos.
- Restricción única `(table_id, user_id)` en `seats`: un usuario, un asiento por mesa.
- `hand_events` permite reproducir la mano completa con el motor.
- Índices: `sessions(token_hash)`, `hands(table_id, started_at)`, `hand_players(user_id)`, `ledger_entries(user_id, created_at)`.
- Todas las operaciones de saldo dentro de transacción con `SELECT … FOR UPDATE` sobre la fila de `wallets`.

**Niveles iniciales (datos semilla)**

| Nivel | Ciegas | Buy-in |
|---|---|---|
| NL2 | 1 / 2 | 80 – 200 |
| NL5 | 2 / 5 | 200 – 500 |
| NL10 | 5 / 10 | 400 – 1.000 |
| NL25 | 10 / 25 | 1.000 – 2.500 |
| NL50 | 25 / 50 | 2.000 – 5.000 |
| NL100 | 50 / 100 | 4.000 – 10.000 |
| NL200 | 100 / 200 | 8.000 – 20.000 |
| NL500 | 200 / 500 | 20.000 – 50.000 |
| NL1000 | 500 / 1.000 | 40.000 – 100.000 |

La fuente única de estos valores es `packages/engine/src/stakes.ts`; la tabla `stakes` de la base de datos se rellena a partir de ese fichero. Sin rake en ningún nivel.

Las mesas son filas en `tables`; cuando todas las de un nivel están llenas, el servidor crea otra.

---

## 9. Cliente (`apps/web`)

### 9.1 Estructura

```
src/
├─ components/     # Presentación pura. Props dentro, callbacks fuera.
├─ features/
│  ├─ auth/        # pantallas + hook useAuth
│  ├─ lobby/       # pantalla + hook useLobby
│  └─ table/       # pantalla + store de mesa + hook useTable
├─ fixtures/       # Datos de ejemplo para stories y tests
├─ lib/
│  ├─ api.ts       # fetch tipado
│  ├─ socket.ts    # WebSocket: reconexión, seq, resincronización
│  └─ router.ts    # router mínimo
└─ styles/         # variables CSS (colores, espaciados)
```

**Separación en tres niveles**

| Nivel | Qué hace | Qué no hace |
|---|---|---|
| `components/` | Pintar según props | Fetch, WebSocket, reglas de póker, estado global |
| `features/*/use*.ts` | Conectar store y red con la pantalla | Pintar |
| `lib/` | Hablar con el servidor | Conocer React |

### 9.2 Convención de componentes

Los componentes se agrupan por área (`base`, `auth`, `lobby`, `table`, `actions`, los mismos grupos de la sección 9.3) y cada uno va en su carpeta:

```
components/table/PlayingCard/
├─ PlayingCard.tsx
├─ PlayingCard.css
├─ PlayingCard.stories.tsx
└─ README.md
```

Un componente puede importar de `base` y de su propio grupo; nunca de `features/` ni de `lib/`.

**Flujo de trabajo: Storybook primero.** Todo componente se construye y se revisa en Storybook antes de conectarlo a una pantalla.

- Cada componente tiene una story por estado relevante (p. ej. `Seat`: vacío, sentado, en turno, retirado, all-in, ganador).
- Las stories se alimentan de datos de ejemplo en `src/fixtures/` (vistas de mesa en distintos momentos de una mano), tipados con los tipos de `protocol`. Si el protocolo cambia, las fixtures dejan de compilar.
- Como los componentes solo reciben props, ninguna story necesita servidor, WebSocket ni base de datos.
- Las pantallas completas (`LobbyScreen`, `TableScreen`) también tienen story, pasándoles una fixture en lugar del hook real.

### 9.3 Inventario de componentes

| Grupo | Componentes |
|---|---|
| Base | `Button`, `TextField`, `Modal`, `Spinner`, `Toast` |
| Auth | `LoginForm`, `RegisterForm` |
| Lobby | `StakeTabs`, `TableList`, `TableRow`, `BalanceBadge` |
| Mesa | `PokerTable`, `Seat`, `PlayingCard`, `CommunityCards`, `ChipStack`, `PotDisplay`, `DealerButton`, `TurnTimer` |
| Acciones | `ActionBar`, `BetSlider`, `BuyInDialog` |

`PokerTable` recibe la vista completa de la mesa y coloca 6 `Seat`; el jugador local siempre se pinta abajo (rotación solo visual).

### 9.4 Estado

- **Estado de mesa:** un store fuera de React con un reducer `(vista, evento) → vista`. Los componentes se suscriben con `useSyncExternalStore`. El reducer es puro y se testea igual que el motor.
- **Sin UI optimista** en las acciones de juego: se deshabilitan los botones al enviar y se espera el evento del servidor. Evita mostrar estados que el servidor luego rechaza.
- **Estado local** (valor del slider, modal abierto): `useState` en el componente.

### 9.5 Pantallas

1. **Registro / Login** → redirige al lobby.
2. **Lobby** → pestañas por nivel, lista de mesas con jugadores sentados, saldo visible.
3. **Mesa** → observar, sentarse con buy-in, jugar, levantarse.

---

## 10. Requisitos no funcionales

| Área | Requisito |
|---|---|
| Latencia | Acción propia reflejada en < 200 ms en red normal |
| Reconexión | Recuperar la mesa tras un corte sin perder el asiento; el turno sigue corriendo |
| Tiempo de turno | 20 s por acción (configurable por nivel) |
| Consistencia | Las fichas totales del sistema solo cambian por entradas explícitas del libro |
| Navegadores | Últimas 2 versiones de Chrome, Firefox, Safari, Edge |
| Pantalla | Usable desde 360 px de ancho |
| Accesibilidad | Acciones de juego operables con teclado; contraste AA |
| Observabilidad | Logs JSON por línea con `tableId` / `handId`; endpoint `/health` |

---

## 11. Escalabilidad

**Versión 1: un solo proceso Node.** Aguanta cientos de mesas; no merece la pena complicarlo antes.

Lo que se hace desde el principio para poder crecer sin reescribir:

- El estado de una mesa está encapsulado en su actor; nada fuera lo lee directamente.
- El acceso a mesas pasa por `table-manager` (`getTable(id)`); hoy devuelve un objeto en memoria, mañana puede enrutar a otro proceso.
- El saldo siempre en PostgreSQL, nunca solo en memoria.

**Camino de crecimiento (cuando haga falta, no antes)**

1. Varios procesos de juego, cada mesa asignada a uno (por `tableId`); un proxy enruta el WebSocket al proceso dueño.
2. Lobby servido desde una caché o réplica de lectura.
3. `hand_events` particionada por fecha; manos antiguas archivadas.

---

## 12. Plan por fases

| Fase | Entrega | Hecho cuando… |
|---|---|---|
| 0. Base | Monorepo, TypeScript, scripts, migración inicial | `npm test` y `npm run dev` funcionan en limpio |
| 1. Motor | `engine` completo con tests | Simulación de miles de manos sin romper invariantes |
| 2. Auth | Registro, login, sesiones, pantallas | Un usuario se registra, entra, sale y vuelve a entrar |
| 3. Lobby | Niveles, mesas, saldo | Se ven mesas por nivel con ocupación real |
| 4. Mesa en vivo | Actor de mesa, WebSocket, UI de mesa | 6 navegadores juegan una mano completa |
| 5. Robustez | Reconexión, timeouts, sit-out, recuperación tras caída | Cortar la red o matar el servidor no pierde fichas |
| 6. Pulido | Animaciones, historial de manos, responsive | Jugable en móvil y escritorio |

El motor va primero: es independiente de todo lo demás y es donde un error cuesta más.

**En paralelo a las fases 1–3:** los componentes de la sección 9.3 se van construyendo en Storybook con fixtures. Solo necesitan los tipos de `protocol`, así que no dependen de que el servidor exista. Al llegar a la fase 4, la UI de mesa ya está hecha y solo queda conectarla.

---

## 13. Decisiones abiertas

| # | Pregunta | Propuesta por defecto |
|---|---|---|
| 1 | Saldo inicial y recarga cuando el jugador se arruina | 10.000 al registrarse; recarga gratuita diaria |
| 2 | ¿Verificación de email y recuperación de contraseña en v1? | No en v1 (requiere servicio de correo) | mejor en v2
| 3 | Entrada de jugador nuevo Esperar a la ciega grande 
| 4 | ¿Se puede jugar en varias mesas a la vez? | no, con límite en v1 |
| 6 | Dónde se despliega | Sin decidir; solo exige Node + PostgreSQL |
