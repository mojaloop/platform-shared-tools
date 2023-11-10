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

export interface DetailsReport {
	matrixId: string;
	settlementDate: string;
	payerFspId: string;
	payerParticipantName: string;
	payeeFspId: string;
	payeeParticipantName: string;
	transferId: string;
	transactionType: string;
	transactionDate: number | string;
	payerIdType: string;
	payerIdentifier: string;
	payeeIdType: string;
	Amount: string;
	Currency: string;
}
