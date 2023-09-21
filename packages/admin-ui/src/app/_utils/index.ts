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
}

export const validateCIDR = (input: string): boolean => {
	// Regular expression for CIDR notation validation
	const cidrRegex = /^(?:\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;

	// Check if the input matches the CIDR regex
	return cidrRegex.test(input);
}

export const validatePortRange = (rangeFirst?: number | null, rangeLast?: number | null): boolean => {
	// Check if either both `rangeFirst` and `rangeLast` are null, or both are valid numbers
	if (
	  !(rangeFirst === null && rangeLast === null) &&
	  !(rangeFirst === 0 && rangeLast === 0) && // Updated this line
	  (!(typeof rangeFirst === 'number' && typeof rangeLast === 'number') ||
		rangeFirst >= rangeLast)
	) {
	  // Invalid port range
	  return false;
	}
	// Valid port range
	return true;
  };
  

export const validatePorts = (portString: string | undefined): boolean => {
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


