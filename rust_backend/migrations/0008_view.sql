create materialized view track_play_counts as
select
    track_id,
    count(*) as total_plays,
    count(*) filter (
        where
            played_at >= now () - interval '30 days'
    ) as monthly_plays,
    count(*) filter (
        where
            played_at >= now () - interval '7 days'
    ) as weekly_plays,
    count(*) filter (
        where
            played_at >= now () - interval '1 day'
    ) as daily_plays
from
    track_plays
group by
    track_id;