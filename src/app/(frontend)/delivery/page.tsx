import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/layout/LegalPage";
import { COMPANY, TERMS, formattedAddress } from "@/lib/company";

export const metadata: Metadata = {
  title: "Доставка и плащане",
  description:
    "Начини на доставка и плащане, срокове и цени при поръчка на банцигови ленти и режещи инструменти от ТЕХНОЛЕС.",
};

/**
 * Every figure here is read from src/lib/company.ts, which mirrors the values
 * the cart and the order route actually use. If the free-shipping threshold
 * changes in code, this page changes with it — a delivery page that disagrees
 * with checkout is worse than no delivery page.
 */
export default function DeliveryPage() {
  return (
    <LegalPage
      eyebrowNumber="№ 10"
      eyebrowLabel="Условия"
      title="Доставка и плащане"
      description="Как стигат до вас поръчаните ленти и как се плаща за тях."
      updated="2026-08-06"
    >
      <LegalSection n="01" title="Начини на доставка">
        <p>
          Доставяме с куриер до адрес или до офис на куриерската фирма на територията на
          {" "}{COMPANY.address.country}. Работим с Еконт и Спиди — куриерът се избира при
          обработката на поръчката според вашия адрес.
        </p>
        <p>
          Можете и да вземете поръчката лично от цеха ни: {formattedAddress()}. Обаждаме се,
          когато лентата е готова. Личното вземане е безплатно.
        </p>
      </LegalSection>

      <LegalSection n="02" title="Цена на доставката">
        <dl>
          <dt>Стандартна доставка</dt>
          <dd className="tabular-nums">{TERMS.shippingCost.toFixed(2)} € с куриер до адрес или офис</dd>
          <dt>Безплатна доставка</dt>
          <dd className="tabular-nums">при поръчка над {TERMS.freeShippingThreshold} € без ДДС</dd>
          <dt>Лично вземане</dt>
          <dd>безплатно, от цеха в {COMPANY.address.city}</dd>
        </dl>
        <p>
          Цената на доставката се изчислява автоматично в количката и се вижда преди
          потвърждение на поръчката.
        </p>
      </LegalSection>

      <LegalSection n="03" title="Срокове">
        <p>
          <strong>Артикули от склад</strong> се експедират след потвърждаване на поръчката.
        </p>
        <p>
          <strong>Ленти по поръчка</strong> се режат и заваряват на заявения от вас размер.
          Срокът за изработка се потвърждава от наш инженер при обработката на поръчката,
          защото зависи от размера, материала и текущата натовареност на цеха.
        </p>
        <p>
          Срокът на куриера се добавя към срока за изработка и зависи от избраната
          куриерска фирма и населеното място.
        </p>
      </LegalSection>

      <LegalSection n="04" title="Начини на плащане">
        <h3>Банков превод</h3>
        <p>
          След потвърждение на поръчката получавате данни за превод. Поръчката влиза в
          производство след постъпване на сумата по сметката.
        </p>
        <dl>
          <dt>Получател</dt>
          <dd>{COMPANY.legalName}</dd>
          <dt>Банка</dt>
          <dd>{COMPANY.bank.name}</dd>
          <dt>IBAN</dt>
          <dd className="tabular-nums">{COMPANY.bank.iban}</dd>
          <dt>BIC</dt>
          <dd>{COMPANY.bank.bic}</dd>
          <dt>Основание</dt>
          <dd>номерът на вашата поръчка</dd>
        </dl>

        <h3>Наложен платеж</h3>
        <p>
          Плащате на куриера при получаване. Таксата за наложен платеж се определя от
          куриерската фирма и се заплаща от получателя.
        </p>

        <h3>Плащане с карта</h3>
        <p>
          Плащането с банкова карта предстои да бъде включено. Междувременно приемаме
          банков превод и наложен платеж.
        </p>
      </LegalSection>

      <LegalSection n="05" title="Цени и ДДС">
        <p>
          Всички цени в сайта са в евро (€) <strong>без ДДС</strong>. Начисленият ДДС е
          {" "}{(TERMS.vatRate * 100).toFixed(0)}% и се показва отделно в количката и в
          потвърждението на поръчката.
        </p>
        <p>
          Цената на лента по поръчка се изчислява по актуалния ни ценоразпис според дължина,
          широчина, дебелина, материал и избраните обработки (заваряване, чапраз, заточване,
          термообработка). Сумата се преизчислява при потвърждение на поръчката по
          ценоразписа, валиден в този момент.
        </p>
      </LegalSection>

      <LegalSection n="06" title="Проверка при получаване">
        <p>
          Прегледайте пратката в присъствието на куриера. При видима повреда на опаковката
          или несъответствие опишете това в товарителницата и ни уведомете веднага на{" "}
          <a href={COMPANY.phone.office.href}>{COMPANY.phone.office.display}</a> или{" "}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
        </p>
        <p>
          Условията за връщане и рекламация са описани в{" "}
          <Link href="/terms">Общите условия</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
