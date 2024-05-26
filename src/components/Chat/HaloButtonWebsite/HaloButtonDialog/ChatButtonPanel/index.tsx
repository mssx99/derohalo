import React from 'react';
import { FormElement } from 'components/common/Form';
import Alias from './Alias';
import Address from './Address';
import DefaultMessage from './DefaultMessage';

const ChatButtonPanel: React.FC = () => {
    return (
        <>
            <FormElement label="Alias">
                <Alias />
            </FormElement>
            <FormElement label="Address">
                <Address />
            </FormElement>
            <FormElement label="Default Message">
                <DefaultMessage />
            </FormElement>
        </>
    );
};

export default ChatButtonPanel;
