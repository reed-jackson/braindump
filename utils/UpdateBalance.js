export default function updateBalance(cost) {
	// Get the current balance from local storage
	let balance = localStorage.getItem("balance");

	// Convert the balance to a number
	balance = parseFloat(balance);

	// Deduct the cost from the balance
	const newBalance = balance - cost;

	// Update the balance in local storage
	localStorage.setItem("balance", newBalance);

	return newBalance;
}
