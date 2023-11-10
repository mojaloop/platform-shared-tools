export interface MatrixId {
	id: string;
}

export interface Report {
	totalAmountSent: number;
	totalSentCount: number;
	totalAmountReceived: number;
	totalReceivedCount: number;
	matrixId: string;
	settlementDate: number;
	paramParticipantId: string;
	paramParticipantName: string;
	relateParticipantId: string;
	relateParticipantName: string;
}
