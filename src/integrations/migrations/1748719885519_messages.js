/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.dropIndex('messages', 'room_id');
  pgm.dropTable('messages');

  pgm.createTable('messages', {
    id: {
      type: 'serial',
      primaryKey: true,
      comment: 'Auto-incrementing integer ID',
    },
    room_id: {
      type: 'varchar(5)',
      notNull: true,
      references: 'rooms(id)',
      onDelete: 'CASCADE',
      comment: 'ID da sala à qual a mensagem pertence',
    },
    content: {
      type: 'text',
      notNull: true,
      comment: 'Conteúdo da mensagem',
    },
    author: {
      type: 'varchar(255)',
      notNull: false, // Can be null for anonymous messages
      comment: 'Nome opcional do usuário que enviou a mensagem',
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
      comment: 'Data e hora de envio da mensagem',
    },
  });

  pgm.createIndex('messages', 'room_id');
  pgm.createIndex('messages', 'created_at');
  pgm.createIndex('messages', ['room_id', 'created_at']);
};

exports.down = pgm => {
  pgm.dropIndex('messages', ['room_id', 'created_at']);
  pgm.dropIndex('messages', 'created_at');
  pgm.dropIndex('messages', 'room_id');

  pgm.dropTable('messages');

  pgm.createTable('messages', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
      comment: 'ID único da mensagem',
    },
    content: {
      type: 'text',
      notNull: true,
      comment: 'Conteúdo da mensagem',
    },
    username: {
      type: 'varchar(255)',
      comment: 'Nome opcional do usuário que enviou a mensagem',
    },
    room_id: {
      type: 'varchar(5)',
      notNull: true,
      references: 'rooms(id)',
      onDelete: 'CASCADE',
      comment: 'ID da sala à qual a mensagem pertence',
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
      comment: 'Data e hora de envio da mensagem',
    },
  });

  pgm.createIndex('messages', 'room_id');
};
