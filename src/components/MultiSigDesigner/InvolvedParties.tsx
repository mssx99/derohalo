import React from 'react';
import { styled } from '@mui/material/styles';
import { useInvolvedParties } from 'hooks/multiSigHooks';
import InvolvedParty from './InvolvedParty';
import { StrictModeDroppable } from 'components/common/StrictModeDroppable';

const Container = styled('div')({
    minHeight: '40px',
    display: 'inline-flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingLeft: 10,
    '& [data-rbd-placeholder-context-id]': {
        display: 'none !important',
    },
});

interface IContainer {}

const InvolvedParties: React.FC<IContainer> = ({}: IContainer) => {
    const [involvedParties, setInvolvedParties] = useInvolvedParties();
    return (
        <StrictModeDroppable droppableId="INVOLVED_PARTIES" type="GROUP_CONTAINER" direction="horizontal" isDropDisabled={true}>
            {(provided, snapshot) => (
                <Container ref={provided.innerRef} {...provided.droppableProps} className="involvedParties-droppable preventSelect">
                    {involvedParties.map((wallet, index) => (
                        <InvolvedParty key={index} wallet={wallet} index={index} />
                    ))}
                    {provided.placeholder}
                </Container>
            )}
        </StrictModeDroppable>
    );
};

export default InvolvedParties;
