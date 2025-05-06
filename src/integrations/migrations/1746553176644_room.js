/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Criar a tabela de salas (rooms)
  pgm.createTable('rooms', {
    id: {
      type: 'varchar(5)',
      primaryKey: true,
      comment: 'ID alfanumérico da sala (até 5 caracteres)',
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
      comment: 'Nome da sala',
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
      comment: 'Data e hora de criação da sala',
    },
  });

  // Criar a tabela de mensagens (messages)
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
      references: '"rooms"',
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

  // Criar índice para melhorar a performance de consultas na tabela messages
  pgm.createIndex('messages', 'room_id');
};

exports.down = (pgm) => {
  pgm.dropIndex('messages', 'room_id');
  pgm.dropTable('messages');
  pgm.dropTable('rooms');
};
