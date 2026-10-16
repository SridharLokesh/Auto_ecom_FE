/**
 * Pure helpers for showing a nearby-inventory API response to a customer.
 * Used by AvailabilityResult (product page + checkout).
 */
const MAX_DISTANCES_SHOWN = 3;

// 15 -> "15", 15.04 -> "15", 24.6 -> "24.6"
export const formatKm = (km) => {
  const rounded = Math.round(Number(km) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

const toDistances = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .map((row) => Number(row?.distanceKm))
    .filter((d) => Number.isFinite(d) && d >= 0)
    .sort((a, b) => a - b)
    .slice(0, MAX_DISTANCES_SHOWN);

/** Normalises an API response into what should be displayed. */
export const summarizeAvailability = (result) => {
  const eligibleRows = Array.isArray(result?.candidates) ? result.candidates : [];
  const hasEligible = eligibleRows.length > 0;
  const distances = toDistances(hasEligible ? eligibleRows : result?.alternatives);
  const express = hasEligible && eligibleRows.some((row) => row?.expressEligible);
  return { hasEligible, distances, express };
};

/** 'green' when serviceable / express, otherwise 'blue'. */
export const availabilityTone = (result) => {
  const { hasEligible, express, distances } = summarizeAvailability(result);
  return express || (hasEligible && distances.length > 0) ? 'green' : 'blue';
};