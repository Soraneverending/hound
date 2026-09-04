create table if not exists board_posts (
  id         serial primary key,
  kind       text not null check (kind in ('comment', 'wish')),
  body       text not null,
  handle     text not null default 'Neighbor',
  created_at timestamptz not null default now()
);

create index if not exists board_posts_created_at_idx on board_posts (created_at desc);

insert into board_posts (kind, body, handle)
select 'wish', 'Put farmers markets next to Vons when I scan produce.', 'Neighbor'
where not exists (select 1 from board_posts);

insert into board_posts (kind, body, handle)
select 'comment', 'The pin + snag flow is the part I would actually use every week.', 'Glendora'
where not exists (select 1 from board_posts where handle = 'Glendora');
