-- E-kirjade päisepilt: lai JPEG (1200x600), mille halduse leht teeb pildi üleslaadimisel.
-- Püstine foto oleks kirjas telefonis liiga kõrge ja Outlook ei näita WebP-pilte.
alter table public.workshops add column if not exists email_image_url text;

update public.workshops
set email_image_url = '/opitoad/tapikangaspuu-kiri.jpg'
where image_url = '/opitoad/tapikangaspuu.webp' and email_image_url is null;
