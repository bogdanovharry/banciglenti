import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/layout/LegalPage";
import { COMPANY, TERMS } from "@/lib/company";

export const metadata: Metadata = {
  title: "За нас",
  description:
    "ТЕХНОЛЕС ООД — производство и заваряване на банцигови ленти по размер от 1993 г. Цех в Габрово.",
};

/**
 * Deliberately short on claims. Everything stated is either a company
 * registration detail or something the site itself demonstrably does. Figures
 * that appear elsewhere in marketing copy but are not verifiable from anything
 * in this repository — customer counts, tolerances, certifications — are left
 * out rather than repeated here, since this is the page people cite.
 */
export default function AboutPage() {
  const years = new Date().getFullYear() - COMPANY.foundedYear;

  return (
    <LegalPage
      eyebrowNumber="№ 00"
      eyebrowLabel={`Tehnoles Ltd. · est. ${COMPANY.foundedYear}`}
      title="За нас"
      description="Режещи инструменти по размер, от собствен цех в Габрово."
      updated="2026-08-06"
    >
      <LegalSection n="01" title="Какво правим">
        <p>
          {COMPANY.legalName} доставя банцигови ленти, циркулярни триони, ножове за абрихт,
          абразиви и заточни машини за дървообработка, металообработка и хранителна
          промишленост.
        </p>
        <p>
          Основната ни работа е <strong>изработка по размер</strong>: режем лентата на
          заявената от вас дължина и я заваряваме на контур, така че да пасне точно на
          вашата машина. Заваряваме контури от {TERMS.customLengthMin.toLocaleString("bg-BG")} до{" "}
          {TERMS.customLengthMax.toLocaleString("bg-BG")} мм.
        </p>
        <p>
          В цеха предлагаме и обработка на вече закупени ленти — заточване, чапраз,
          термообработка. Заточена лента реже като нова на част от цената на нова.
        </p>
      </LegalSection>

      <LegalSection n="02" title="Фирмени данни">
        <dl>
          <dt>Наименование</dt>
          <dd>{COMPANY.legalName}</dd>
          <dt>ДДС номер</dt>
          <dd className="tabular-nums">{COMPANY.vatNumber}</dd>
          <dt>Адрес на управление и цех</dt>
          <dd>
            {COMPANY.address.street}
            <br />
            {COMPANY.address.postalCode} {COMPANY.address.city}, {COMPANY.address.country}
          </dd>
          <dt>Основана</dt>
          <dd className="tabular-nums">
            {COMPANY.foundedYear} г. · {years} години дейност
          </dd>
        </dl>
      </LegalSection>

      <LegalSection n="03" title="Контакт">
        <dl>
          <dt>Телефон</dt>
          <dd>
            <a href={COMPANY.phone.office.href}>{COMPANY.phone.office.display}</a>
          </dd>
          <dt>Мобилен</dt>
          <dd>
            <a href={COMPANY.phone.mobile.href}>{COMPANY.phone.mobile.display}</a>
          </dd>
          <dt>Имейл</dt>
          <dd>
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          </dd>
          <dt>Работно време</dt>
          <dd>{COMPANY.hours}</dd>
        </dl>
        <p>
          За избор на лента, диагностика на проблем с рязането или оразмеряване по стара
          машина без маркировка — обадете се или{" "}
          <Link href="/contact">изпратете запитване</Link>. Консултацията е безплатна.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
