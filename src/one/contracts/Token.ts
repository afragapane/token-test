import {SmartContract, Address, Fixed, MapStorage, constant, Deploy, receive, Blockchain, Hash256} from '@neo-one/smart-contract';

export class Token extends SmartContract {
    public readonly name = 'Eon';
    public readonly symbol = 'EON';
    public readonly decimals = 8;
    private mutableSupply: Fixed<8> = 0;
    private readonly balances = MapStorage.for<Address, Fixed<8>>();

    public constructor(public readonly owner = Deploy.senderAddress) {
        super();
        if (!Address.isCaller(owner)) {
            throw new Error('Sender was not the owner');
        }
    }

    @constant
    public totalSupply(): Fixed<8> {
        return this.mutableSupply;
    }

    @constant
    public balanceOf(address: Address): Fixed<8> {
        const balance = this.balances.get(address);

        return balance === undefined ? 0 : balance;
    }

    public transfer(from: Address, to: Address, amount: Fixed<8>): boolean {
        if (amount < 0) {
            throw new Error(`Amount must be greater than 0. Received ${amount}`);
        }

        if (!Address.isCaller(from)) {
            return false;
        }

        const fromBalance = this.balanceOf(from);
        if (fromBalance < amount) {
            return false;
        }

        const toBalance = this.balanceOf(to);
        this.balances.set(from, fromBalance - amount);
        this.balances.set(to, toBalance + amount);

        return true;
    }

    @receive
    public mintTokens() {
        const {references, outputs} = Blockchain.currentTransaction;
        if (references.length === 0) {
            return false;
        }

        const sender = references[0].address;

        let amount = 0;
        for (const output of outputs) {
            if (output.address.equals(this.address)) {
                if (!output.asset.equals(Hash256.NEO)) {
                    return false;
                }

                amount += output.value;
            }
        }

        this.issue(sender, amount);

        return true;
    }

    private issue(address: Address, amount: Fixed<8>): void {
        this.balances.set(address, this.balanceOf(address) + amount);

        this.mutableSupply += amount;
    }
};