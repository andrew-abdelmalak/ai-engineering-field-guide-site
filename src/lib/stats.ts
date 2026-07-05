import { getDirectory } from "./github";

export type FieldGuideStats = {
  jobDescriptions: number;
  scrapeDates: number;
  interviewCompanies: number;
};

/**
 * Computes headline scale numbers straight from the live directory tree
 * (rather than a hardcoded figure from the README prose), so they stay
 * accurate as the author adds new scrape dates or companies.
 */
export async function getFieldGuideStats(): Promise<FieldGuideStats> {
  const dateDirs = await getDirectory("job-market/data_structured").catch(() => []);
  const counts = await Promise.all(
    dateDirs.filter((d) => d.type === "dir").map((d) => getDirectory(d.path).catch(() => [])),
  );
  const jobDescriptions = counts.reduce((sum, entries) => sum + entries.length, 0);

  const companies = await getDirectory("interview/data/job-descriptions").catch(() => []);

  return {
    jobDescriptions,
    scrapeDates: dateDirs.length,
    interviewCompanies: companies.length,
  };
}
