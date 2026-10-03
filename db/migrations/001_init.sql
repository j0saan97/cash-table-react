-- Esquema inicial. Importes siempre en BIGINT, en la unidad mínima de ficha.

BEGIN;

-- Cuenta: identidad y credenciales.
CREATE TABLE users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         TEXT NOT NULL,
  username      TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_key ON users (lower(email));
CREATE UNIQUE INDEX users_username_key ON users (lower(username));

-- Solo se guarda el hash SHA-256 del token de sesión.
CREATE TABLE sessions (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash BYTEA NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_id_idx ON sessions (user_id);

-- Saldo fuera de las mesas. Derivado de ledger_entries; se actualiza en la misma transacción.
CREATE TABLE wallets (
  user_id BIGINT PRIMARY KEY REFERENCES users (id),
  balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0)
);

-- Niveles. Se rellena desde packages/engine/src/stakes.ts.
CREATE TABLE stakes (
  id          TEXT PRIMARY KEY,
  small_blind BIGINT NOT NULL CHECK (small_blind > 0),
  big_blind   BIGINT NOT NULL CHECK (big_blind > small_blind),
  min_buyin   BIGINT NOT NULL CHECK (min_buyin > 0),
  max_buyin   BIGINT NOT NULL CHECK (max_buyin >= min_buyin)
);

CREATE TABLE tables (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stake_id   TEXT NOT NULL REFERENCES stakes (id),
  name       TEXT NOT NULL UNIQUE,
  max_seats  SMALLINT NOT NULL DEFAULT 6 CHECK (max_seats BETWEEN 2 AND 6),
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tables_stake_id_idx ON tables (stake_id);

-- "Jugador" = un usuario sentado en una mesa. La fila existe mientras está sentado.
CREATE TABLE seats (
  table_id  BIGINT NOT NULL REFERENCES tables (id),
  seat_no   SMALLINT NOT NULL CHECK (seat_no BETWEEN 0 AND 5),
  user_id   BIGINT NOT NULL REFERENCES users (id),
  stack     BIGINT NOT NULL CHECK (stack >= 0),
  seated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (table_id, seat_no),
  UNIQUE (table_id, user_id)
);
CREATE INDEX seats_user_id_idx ON seats (user_id);

CREATE TABLE hands (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_id    BIGINT NOT NULL REFERENCES tables (id),
  -- Ciegas copiadas del nivel: el historial no cambia si el nivel se modifica.
  small_blind BIGINT NOT NULL,
  big_blind   BIGINT NOT NULL,
  button_seat SMALLINT NOT NULL,
  -- Mazo barajado completo; con hand_events permite reproducir la mano.
  deck        TEXT[] NOT NULL,
  board       TEXT[] NOT NULL DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'complete', 'voided')),
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at    TIMESTAMPTZ
);
CREATE INDEX hands_table_started_idx ON hands (table_id, started_at);
-- Recuperación tras caída: localizar rápido las manos sin cerrar.
CREATE INDEX hands_in_progress_idx ON hands (table_id) WHERE status = 'in_progress';

-- Participación de un usuario en una mano concreta.
CREATE TABLE hand_players (
  hand_id     BIGINT NOT NULL REFERENCES hands (id),
  user_id     BIGINT NOT NULL REFERENCES users (id),
  seat_no     SMALLINT NOT NULL,
  start_stack BIGINT NOT NULL CHECK (start_stack >= 0),
  end_stack   BIGINT CHECK (end_stack >= 0),
  hole_cards  TEXT[] NOT NULL,
  PRIMARY KEY (hand_id, user_id),
  UNIQUE (hand_id, seat_no)
);
CREATE INDEX hand_players_user_id_idx ON hand_players (user_id, hand_id);

CREATE TABLE hand_events (
  hand_id BIGINT NOT NULL REFERENCES hands (id),
  seq     INTEGER NOT NULL,
  type    TEXT NOT NULL,
  payload JSONB NOT NULL,
  PRIMARY KEY (hand_id, seq)
);

-- Libro de movimientos del saldo. Solo inserción: nunca UPDATE ni DELETE.
CREATE TABLE ledger_entries (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users (id),
  amount     BIGINT NOT NULL CHECK (amount <> 0),
  reason     TEXT NOT NULL CHECK (reason IN ('signup_bonus', 'daily_refill', 'buy_in', 'rebuy', 'cash_out')),
  table_id   BIGINT REFERENCES tables (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ledger_entries_user_created_idx ON ledger_entries (user_id, created_at);

COMMIT;
