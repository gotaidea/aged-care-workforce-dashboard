/**
 * Data access layer -- all Supabase queries go here.
 * Components call these functions via useQuery().
 */
import { supabase } from "./supabase";
import { format, subMonths } from "date-fns";

const TWO_YEARS_AGO = format(subMonths(new Date(), 24), "yyyy-MM-dd");

export async function fetchLatestUnemploymentRate() {
  const { data, error } = await supabase
    .from("employment_data")
    .select("period, unemployment_rate")
    .eq("care_type", "sector_wide")
    .not("unemployment_rate", "is", null)
    .order("period", { ascending: false })
    .limit(2);
  if (error) throw error;
  return data;
}

export async function fetchLatestEmploymentLevel() {
  const { data, error } = await supabase
    .from("employment_data")
    .select("period, employed_total, care_type")
    .not("employed_total", "is", null)
    .order("period", { ascending: false })
    .limit(6);
  if (error) throw error;
  return data;
}

export async function fetchLatestWPI() {
  const { data, error } = await supabase
    .from("wage_data")
    .select("period, industry, wpi_annual_change")
    .not("wpi_annual_change", "is", null)
    .order("period", { ascending: false })
    .limit(4);
  if (error) throw error;
  return data;
}

export async function fetchShortageStatus() {
  const { data, error } = await supabase
    .from("shortage_status")
    .select("occupation, shortage_level, care_type")
    .order("period", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data;
}

export async function fetchLatestJobAds() {
  const { data, error } = await supabase
    .from("job_ads")
    .select("period, care_type, role_category, ad_count, platform")
    .eq("platform", "seek")
    .is("state", null)
    .order("period", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data;
}

export async function fetchEmploymentTrend(careType = "sector_wide") {
  const { data, error } = await supabase
    .from("employment_data")
    .select("period, employed_total, employed_fulltime, employed_parttime, unemployment_rate")
    .eq("care_type", careType)
    .gte("period", TWO_YEARS_AGO)
    .order("period", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchWageTrend() {
  const { data, error } = await supabase
    .from("wage_data")
    .select("period, industry, wpi_index, wpi_annual_change")
    .gte("period", TWO_YEARS_AGO)
    .order("period", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchJobAdTrend(careType = "sector_wide") {
  const { data, error } = await supabase
    .from("job_ads")
    .select("period, care_type, role_category, ad_count")
    .eq("platform", "seek")
    .eq("care_type", careType)
    .is("state", null)
    .gte("period", TWO_YEARS_AGO)
    .order("period", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchJobAdsByState() {
  const { data, error } = await supabase
    .from("job_ads")
    .select("period, state, ad_count")
    .eq("platform", "seek")
    .eq("care_type", "sector_wide")
    .eq("role_category", "All Aged Care (SEEK category)")
    .not("state", "is", null)
    .order("period", { ascending: false })
    .limit(16);
  if (error) throw error;
  return data;
}

export async function fetchWorkforceCharacteristics(careType) {
  const query = supabase
    .from("workforce_characteristics")
    .select("period, care_type, metric, value, unit")
    .order("period", { ascending: false });
  if (careType) query.eq("care_type", careType);
  const { data, error } = await query.limit(100);
  if (error) throw error;
  return data;
}

export async function fetchNewsItems(limit = 40) {
  const { data, error } = await supabase
    .from("news_items")
    .select("title, url, source, published_at")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
