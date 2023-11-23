import * as IlpPacket from "ilp-packet";

/**
 * Remove empty value of an object
 * @param {object} obj - An object to remove
 */
export const removeEmpty = <T extends Record<string, any>>(obj: T): T => {
	Object.entries(obj).forEach(([key, val]) =>
		(val && typeof val === "object") && removeEmpty(val) ||
		(val === null || val === "") && delete obj[key]
	);
	return obj;
};

export const deserializeIlpPacket = (base64IlpPacket: any): any => {
	//debugger
	let decodedIlpPacketDataJsonString: any;
	try {
		const ilpPacketBuffer: any = Buffer.from(base64IlpPacket, "base64");
		const decodedIlpPacket: any = IlpPacket.deserializeIlpPacket(ilpPacketBuffer);
		decodedIlpPacketDataJsonString = JSON.parse(
			Buffer.from(decodedIlpPacket.data.data.toString("utf8"), "base64").toString("utf8")
		);
	} catch (error: any) {
		console.error("Unable to decode ILP Packet", error);
	}

	return decodedIlpPacketDataJsonString ? decodedIlpPacketDataJsonString : base64IlpPacket;
};


// ref https://www.zacfukuda.com/blog/pagination-algorithm
export type PaginateResult = {
	next: number | null;
	current: number;
	prev: number | null;
	items: (number | null)[]
	totalPages: number;
	pageSize?: number;
}

export function paginate(current: number, max: number): PaginateResult | null {
	// this alg is 1 based, so increaing current by one
	current++;

	if (!current || !max) return null;

	const prev: null | number = current === 1 ? null : current - 1,
		next: null | number = current === max ? null : current + 1,
		items: (number | null)[] = [1];

	if (current === 1 && max === 1) return {current, prev, next, items, totalPages:max};
	if (current > 4) items.push(null);

	const r = 2, r1 = current - r, r2 = current + r;

	for (let i = r1 > 2 ? r1 : 2; i <= Math.min(max, r2); i++) items.push(i);

	if (r2 + 1 < max) items.push(null);
	if (r2 < max) items.push(max);

	return {current, prev, next, items, totalPages:max};
}

export function validateCIDR(input: string): boolean {
	// Regular expression for CIDR notation validation
	const cidrRegex = /^(?:\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;

	// Check if the input matches the CIDR regex
	return cidrRegex.test(input);
}

export function validatePortRange(rangeFirst?: number | null, rangeLast?: number | null): boolean {
// Check if either both `rangeFirst` and `rangeLast` are null, or both are valid numbers
	if (!(rangeFirst === null && rangeLast === null) &&
		!(rangeFirst === 0 && rangeLast === 0) && // Updated this line
		(!(typeof rangeFirst === 'number' && typeof rangeLast === 'number') ||
			rangeFirst >= rangeLast)
	) {
		// Invalid port range
		return false;
	}
// Valid port range
	return true;
}

export function validatePorts(portString: string | undefined): boolean {

	if (typeof portString !== 'string') {
		// Port input should be a string
		return false;
	}

	// Regular expression for ports validation
	const portsRegex = /^([1-9]\d*)(,[1-9]\d*)*$/;
	if (!portsRegex.test(portString)) {
		return false;
	}

	// Split the comma-separated string
	const portsArray = portString.split(',').map((port) => parseInt(port.trim(), 10));

	// Check if each port in the array is a valid number
	for (const port of portsArray) {
		if (isNaN(port) || port < 1 || port > 65535) {
			// Invalid port number
			return false;
		}
	}

	// Valid ports array
	return true;
}


export function formatNumber(number: string | number) {
	// const numberFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 });
	// TODO: take this format from use profile OR use default from browser, we can't assume everyone wants "en-US"
	const numberFormatter = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2 });
	return numberFormatter.format(Number(number));
}



