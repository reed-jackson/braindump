export const calculateBonus = (amount) => {
	if (amount < 1500) {
		return amount * 0.5;
	} else if (amount > 1499) {
		return amount * 1;
	} else {
		return amount;
	}
};
