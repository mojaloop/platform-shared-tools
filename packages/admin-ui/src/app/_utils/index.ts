/**
 * Remove empty value of an object
 * @param {object} obj - An object to remove
 */
export const removeEmpty = <T extends Record<string, any>>(obj: T): T => {
	Object.entries(obj).forEach(([key, val]) =>
		(val && typeof val==='object') && removeEmpty(val) ||
		(val===null || val==="") && delete obj[key]
	);
	return obj;
};