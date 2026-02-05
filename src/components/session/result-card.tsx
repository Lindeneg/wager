import {BalanceCard} from "@/components/balance-card";
import {calculateBalanceFromResultData} from "@/lib/balance";
import type {User} from "./types";

interface ResultCardProps {
    user: User;
    resultData: Record<string, Record<string, number>>;
    users: User[];
    compact?: boolean;
}

export function ResultCard({user, resultData, users, compact}: ResultCardProps) {
    const userMap = new Map(users.map((u) => [u.id.toString(), u.name]));
    const balance = calculateBalanceFromResultData(user.id, resultData, userMap);

    return (
        <BalanceCard
            name={user.name}
            netTotal={balance.netTotal}
            totalOwed={balance.totalOwed}
            totalOwes={balance.totalOwes}
            owedFrom={balance.owedFrom}
            owesTo={balance.owesTo}
            compact={compact}
        />
    );
}
