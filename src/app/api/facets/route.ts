import { NextResponse } from "next/server"
import productsData from "../../../../mock-data/products.json"
import { collectFacets } from "@/lib/facets"

export async function GET() {
  return NextResponse.json(collectFacets(productsData))
}
