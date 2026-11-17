import { notFound } from "next/navigation";

/**
 * Any address that matches no page lands here and is answered with the shop's own
 * "not found" page (menu, search, the three ways out) instead of the bare default
 * one, which is English, has no menu and does not know which language the shop speaks.
 */
export default function UnknownPage() {
  notFound();
}
