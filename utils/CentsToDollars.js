/**
 * Converts cents to dollars.
 * @param {number} cents - The amount in cents.
 * @returns {string} The formatted dollar amount as a string.
 */
export function centsToDollars(cents) {
	const dollars = (cents / 100).toFixed(2);
	return `$${dollars}`;
}
