export interface SettlementInitiationReport {
	matrixId: string;
	participantId: string;
	externalBankAccountId: string;
	externalBankAccountName: string;
	participantCurrencyCode: string;
	participantDebitBalance: string;
	participantCreditBalance: string;
	settlementCreatedDate: number;
}

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
	currency: string;
}

export interface DetailReport {
	matrixId: string;
	settlementDate: string;
	payerFspId: string;
	payerParticipantName: string;
	payeeFspId: string;
	payeeParticipantName: string;
	transferId: string;
	transactionType: string;
	transactionDate: number;
	payerIdType: string;
	payerIdentifier: string;
	payeeIdType: string;
	payeeIdentifier: string;
	Amount: string;
	Currency: string;
}
