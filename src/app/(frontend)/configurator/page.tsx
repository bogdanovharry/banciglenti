"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { ConfiguratorPanel } from "@/components/configurator/ConfiguratorPanel";

/**
 * The configurator keeps its own route for deep links and search, but the panel
 * itself also renders inside /shop so a buyer never has to leave the catalogue
 * to price a custom size.
 */
export default function ConfiguratorPage() {
  return (
    <div className="bg-white">
      <PageHeader
        eyebrowNumber="№ 01"
        eyebrowLabel="Конфигуратор"
        image="/images/hero/shutterstock_2512301009.webp"
        imageAlt="Банцигова лента в работа на гатер"
        crumbs={[{ label: "Начало", href: "/" }, { label: "Конфигуратор" }]}
        title={
          <>
            Поръчай лента<br />
            <span className="text-orange-light">по твоя размер.</span>
          </>
        }
        description="Избери типа лента, задай размерите и получи цена веднага — по актуалния ценоразпис. Срокът за изработка се потвърждава при обработката на поръчката."
      />
      <ConfiguratorPanel />
    </div>
  );
}
