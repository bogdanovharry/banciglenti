# Blog

Built on the existing Payload `articles` collection (Admin → Съдържание → Статии).

- **Writing:** title, (slug fills itself from the title), shop (България / Румъния / Всички), category
  (Блог / Техническа информация), summary, body, picture, date, status. Only **Публикувана** articles with a date
  that is not in the future are shown; a draft is not there at all.
- **Per shop:** an article is written in one language and shown only in its shop (or in all).
- **Pages:** `/blog` (filter by category, 12 per page) and `/blog/<slug>` (with Article structured data and a
  link to the configurator). Both are read per request.
- **Links:** the footer links "Блог" only once the shop has a published article; the sitemap lists `/blog` and
  each article the same way.
- **Old shop:** `/bg/news*` redirect to `/blog`; `/bg/tehnicheska-informatsiya` and `/bg/main/technical-info` to
  `/blog?category=technical`.
- **Database:** migration `20261117_120000_articles_market` adds the `market` column. Apply it to each database
  before deploying (production does not migrate itself).
- **No articles are shipped.** The first version of this blog showed invented articles and was taken down; every
  article is written by the owner.
