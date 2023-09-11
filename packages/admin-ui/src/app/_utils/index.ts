import * as IlpPacket from "ilp-packet";

/**
 * Remove empty value of an object
 * @param {object} obj - An object to remove
 */
export const removeEmpty = <T extends Record<string, any>>(obj: T): T => {
	Object.entries(obj).forEach(([key, val]) =>
		(val && typeof val ==="object") && removeEmpty(val) ||
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

	return decodedIlpPacketDataJsonString ? decodedIlpPacketDataJsonString: base64IlpPacket;
}

// ref https://www.zacfukuda.com/blog/pagination-algorithm
export type PaginateResult = {
	next: number | null;
	current: number;
	prev: number | null;
	items: (number|null)[]
}
export function paginate(current:number, max:number): PaginateResult | null{
	// this alg is 1 based, so increaing current by one
	current++;

	if (!current || !max) return null;

	let prev: null | number = current === 1 ? null : current - 1,
		next: null | number = current === max ? null : current + 1,
		items: (number|null)[] = [1];

	if (current === 1 && max === 1) return {current, prev, next, items};
	if (current > 4) items.push(null);

	let r = 2, r1 = current - r, r2 = current + r;

	for (let i = r1 > 2 ? r1 : 2; i <= Math.min(max, r2); i++) items.push(i);

	if (r2 + 1 < max) items.push(null);
	if (r2 < max) items.push(max);

	return {current, prev, next, items};
}
