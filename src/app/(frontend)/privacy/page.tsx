import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/layout/LegalPage";
import { COMPANY, formattedAddress } from "@/lib/company";
import { DEFAULT_MARKET } from "@/lib/market";

export const metadata: Metadata = {
  title: "Политика за поверителност",
  description:
    `Какви лични данни събира ${COMPANY.legalName} през този сайт, на какво основание, кой ги получава и какви права имате.`,
};

/**
 * Describes what this codebase actually does, not a template.
 *
 * Notably it does NOT claim analytics or marketing cookies: the GA4, Meta Pixel
 * and Google Ads IDs exist in .env.example but no loading code exists anywhere
 * in src/, so the site currently sets none. A policy that discloses tracking
 * which is not happening is as wrong as one that hides tracking which is.
 * When analytics are switched on this section has to be revised and a consent
 * banner added first.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrowNumber="№ 12"
      eyebrowLabel="Правна информация"
      title="Политика за поверителност"
      description="Какви данни събираме, защо, кой ги вижда и как да ги контролирате."
      updated="2026-08-06"
    >
      <LegalSection n="01" title="Кой обработва данните ви">
        <p>
          Администратор на личните данни е <strong>{COMPANY.legalName}</strong>, ДДС №{" "}
          {COMPANY.vatNumber}, {formattedAddress()}.
        </p>
        <p>
          По въпроси, свързани с личните ви данни, пишете на{" "}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> или се обадете на{" "}
          <a href={COMPANY.phone.office.href}>{COMPANY.phone.office.display}</a>.
        </p>
      </LegalSection>

      <LegalSection n="02" title="Какви данни събираме">
        <h3>При поръчка</h3>
        <p>
          Име, имейл, телефон, наименование на фирма (ако попълните такова), адрес за
          доставка, съдържание на поръчката и бележка към нея, ако сте оставили.
        </p>

        <h3>При запитване</h3>
        <p>
          Име, имейл, телефон и текста на съобщението ви, за да можем да отговорим.
        </p>

        <h3>Автоматично</h3>
        <p>
          Съдържанието на количката се пази <strong>в браузъра ви</strong> (localStorage),
          не на наш сървър, за да не изчезва при презареждане. Изчиства се, когато изчистите
          данните на сайта в браузъра си.
        </p>
        <p>
          Хостинг платформата ни води стандартни технически логове (IP адрес, време на
          заявката), необходими за сигурността и работата на сайта.
        </p>
      </LegalSection>

      <LegalSection n="03" title="На какво основание">
        <dl>
          <dt>Изпълнение на договор</dt>
          <dd>
            Данните за поръчка и доставка обработваме, за да изпълним поръчката ви — без тях
            тя не може да бъде изпълнена.
          </dd>
          <dt>Законово задължение</dt>
          <dd>
            Счетоводните и данъчните документи съхраняваме, защото законът го изисква.
          </dd>
          <dt>Легитимен интерес</dt>
          <dd>
            Отговаряме на запитвания и поддържаме сигурността на сайта.
          </dd>
        </dl>
      </LegalSection>

      <LegalSection n="04" title="Кой получава данните">
        <p>Предаваме само необходимия минимум и само на:</p>
        <ul>
          <li>
            <strong>Куриерската фирма</strong> ({DEFAULT_MARKET.couriers.join(" или ")}) — име, адрес и телефон, за
            да достави пратката.
          </li>
          <li>
            <strong>Доставчиците на хостинг и база данни</strong>, които поддържат сайта.
            Базата данни се съхранява на сървъри в Европейския съюз.
          </li>
          <li>
            <strong>Счетоводство и държавни органи</strong>, когато законът го изисква.
          </li>
        </ul>
        <p>Не продаваме и не отдаваме данните ви на трети лица за маркетингови цели.</p>
      </LegalSection>

      <LegalSection n="05" title="Бисквитки и проследяване">
        <p>
          <strong>Този сайт не използва бисквитки за анализ или реклама.</strong> Не сме
          включили Google Analytics, Meta Pixel или подобни инструменти.
        </p>
        <p>
          Използваме единствено технически необходими механизми: локално съхранение за
          количката ви и сесийна бисквитка за вход в административния панел, която засяга
          само наши служители.
        </p>
        <p>
          Ако в бъдеще включим инструменти за анализ, ще поискаме съгласието ви предварително
          и ще обновим тази страница.
        </p>
      </LegalSection>

      <LegalSection n="06" title="Колко дълго пазим данните">
        <p>
          Данните за поръчки пазим за срока, изискван от счетоводното и данъчното
          законодателство. Запитвания, които не водят до поръчка, пазим за времето, нужно да
          отговорим и да проследим комуникацията.
        </p>
      </LegalSection>

      <LegalSection n="07" title="Вашите права">
        <p>Съгласно Общия регламент относно защитата на данните (GDPR) имате право да:</p>
        <ul>
          <li>получите достъп до данните, които съхраняваме за вас;</li>
          <li>поискате коригиране на неточни данни;</li>
          <li>поискате изтриване, когато няма законово основание да ги пазим;</li>
          <li>поискате ограничаване на обработването;</li>
          <li>получите данните си в машинно четим формат;</li>
          <li>възразите срещу обработване на основание легитимен интерес.</li>
        </ul>
        <p>
          Пишете ни на <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. Отговаряме в
          срок до един месец.
        </p>
        <p>
          Не вземаме автоматизирани решения и не извършваме профилиране.
        </p>
      </LegalSection>

      <LegalSection n="08" title="Жалби">
        <p>
          Ако смятате, че обработваме данните ви неправомерно, можете да подадете жалба до{" "}
          <strong>Комисията за защита на личните данни</strong> — гр. София 1592, бул.
          „Проф. Цветан Лазаров“ 2,{" "}
          <a href="https://www.cpdp.bg" target="_blank" rel="noopener noreferrer">
            cpdp.bg
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
