import React, { useEffect, useMemo, useCallback } from 'react';
import { styled } from '@mui/material/styles';
import { WALLET_BACKGROUND_COLOR } from 'Constants';
import { useContract, useContractStats, usePartyWallet } from 'hooks/guaranteeHooks';
import Stack from '@mui/material/Stack';
import ChatButton from 'components/common/ChatButton';
import DeroAmount from 'components/common/DeroAmount';
import { useGuaranteePartyDialog } from 'components/GuaranteeDesigner/dialogs/GuaranteePartyDialog';
import DepositButton from './DepositButton';

interface IParty {
    value: 'A' | 'B';
}

const Container = styled('div')`
    color: black;
    background-color: ${WALLET_BACKGROUND_COLOR};
    transition: background-color 0.2s ease-out;
    min-width: 200px;
    flex: 0 1 380px;
    display: flex;
    padding: 5px;
    border-radius: 5px;
    min-height: 120px;
    border: 1px solid #ddd;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    cursor: pointer;
    &:hover {
        background-color: #d6e698;
    }

    @media (max-width: 55rem) {
        flex-basis: 100%;
    }
`;

const Header = styled('div')`
    display: flex;
    flex-direction: row;
`;

const Alias = styled('div')`
    white-space: nowrap;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Account = styled('div')`
    overflow: hidden;
    font-size: 0.625rem;
    overflow-wrap: anywhere;
`;

const StatsContainer = styled('div')`
    display: flex;
    flex-direction: column;
`;

const StatsLine = styled('div')`
    display: flex;
    flex-direction: row;
    justify-content: stretch;
`;

interface IStatsLineImportantProps {
    bgColor?: string;
}

const StatsLineImportant = styled(StatsLine, { shouldForwardProp: (prop: string) => !['bgColor'].includes(prop) })<IStatsLineImportantProps>`
    background-color: ${(props) => props.bgColor || 'transparent'};
    color: white;
    border-radius: 6px;
    padding: 3px;
`;

const StatsDescription = styled('div')``;

const StatsValue = styled('div')`
    flex: 1;
    text-align: right;
`;

const Party: React.FC<IParty> = ({ value: party }) => {
    const { isLoaded, contract } = useContract();
    const wallet = usePartyWallet(party);
    const stats = useContractStats();
    const { setParty } = useGuaranteePartyDialog();

    const partyStats = useMemo(() => {
        const p = party.toLowerCase();
        return {
            RequiredDeposit: stats[p + '_RequiredDeposit'] as Uint64,
            TotalGuarantee: stats[p + '_TotalGuarantee'] as Uint64,
            TotalTransfer: stats[p + '_TotalTransfer'] as Uint64,
            TotalLoss: stats[p + '_TotalLoss'] as Uint64,
            TotalPendingGuarantee: stats[p + '_TotalPendingGuarantee'] as Uint64,
            TotalPendingTransfer: stats[p + '_TotalPendingTransfer'] as Uint64,
        };
    }, [party, stats]);

    const isFunded = party === 'A' ? contract.firstPartyAmountFunded : contract.secondPartyAmountFunded;

    const alias = wallet?.alias ? wallet.alias : '<empty>';

    const address = wallet?.address ? wallet.address : party === 'A' ? '<Party A is required>' : '<Anyone who deposits required amount>';

    useEffect(() => {}, [party, stats, wallet]);

    const handleClick = useCallback(() => {
        console.log('show dialog for party', party);
        setParty(party);
    }, [party]);

    return (
        <Container onClick={handleClick}>
            <Header>
                <Stack direction="column" sx={{ flexGrow: 1, flexShrink: 1, alignItems: 'flex-start' }}>
                    <Alias>{alias}</Alias>
                    <Account>{address}</Account>
                </Stack>
                <DepositButton party={party} />
                {wallet?.address && <ChatButton walletAddress={address} />}
            </Header>
            <StatsContainer>
                {contract.state === 'NEW' || contract.state === 'PENDING_DEPOSITS' ? (
                    <>
                        <StatsLineImportant bgColor={isFunded ? '#005f08dd' : '#680000'}>
                            <StatsDescription>Required Deposit</StatsDescription>
                            <StatsValue>
                                <DeroAmount value={partyStats.RequiredDeposit} />
                            </StatsValue>
                        </StatsLineImportant>
                        <StatsLine>
                            <StatsDescription>Total Guarantee</StatsDescription>
                            <StatsValue>
                                <DeroAmount value={partyStats.TotalGuarantee} />
                            </StatsValue>
                        </StatsLine>
                        <StatsLine>
                            <StatsDescription>Total Transfer</StatsDescription>
                            <StatsValue>
                                <DeroAmount value={partyStats.TotalTransfer} />
                            </StatsValue>
                        </StatsLine>
                    </>
                ) : (
                    <>
                        <StatsLineImportant bgColor="#a01515">
                            <StatsDescription>Total Loss incurred</StatsDescription>
                            <StatsValue>
                                <DeroAmount value={partyStats.TotalLoss} />
                            </StatsValue>
                        </StatsLineImportant>
                        <StatsLine>
                            <StatsDescription>Pending Guarantee</StatsDescription>
                            <StatsValue>
                                <DeroAmount value={partyStats.TotalPendingGuarantee} />
                            </StatsValue>
                        </StatsLine>
                        <StatsLine>
                            <StatsDescription>Pending Transfer</StatsDescription>
                            <StatsValue>
                                <DeroAmount value={partyStats.TotalPendingTransfer} />
                            </StatsValue>
                        </StatsLine>
                    </>
                )}
            </StatsContainer>
        </Container>
    );
};

export default Party;
