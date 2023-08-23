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
