alter table board_posts add column if not exists store_id text;
create index if not exists board_posts_store_id_idx on board_posts (store_id);

update board_posts
set store_id = 'vons'
where store_id is null and body ilike '%vons%';

update board_posts
set store_id = 'gmg'
where store_id is null and body ilike '%snag%';
