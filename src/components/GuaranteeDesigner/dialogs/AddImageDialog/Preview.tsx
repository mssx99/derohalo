import React, { useState, useEffect, useMemo } from 'react';

import { styled } from '@mui/material/styles';
import { formatNumber } from 'helpers/FormatHelper';
import DeroAmount from 'components/common/DeroAmount';
import { fileOrBlobToBase64 } from 'helpers/Helper';
import TextField from 'components/common/TextField';
import Card from '@mui/material/Card';
import { setDescription } from 'hooks/guaranteeHooks';
import { useAddImageDialog } from '.';
import MaxLengthTextField from 'components/common/MaxLengthTextField';

interface IPreview {
    imageBlob?: Blob | null;
    compressedBlob?: Blob | null;
    compressedThumbBlob?: Blob | null;
    base64bytes: number;
    base64bytesThumb: number;
}

const Container = styled('div')`
    margin-top: 20px;
    display: flex;
    flex-direction: row;
    gap: 10px;

    & img {
        object-fit: contain;
        border-radius: 5px;
        max-height: 180px;
        max-width: 100%;
        flex-shrink: 1;
    }

    & div {
        flex-basis: calc(50% - 10px);
        align-items: center;
        display: flex;
        flex-direction: column;
    }
`;

const ThumbContainer = styled('div')`
    margin-top: 20px;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 10px;

    & img {
        object-fit: none;
        border-radius: 5px;
    }
`;

const Preview: React.FC<IPreview> = ({ imageBlob = null, compressedBlob = null, compressedThumbBlob = null, base64bytes, base64bytesThumb }) => {
    const { description, setDescription } = useAddImageDialog();
    const [imageUrl, setImageUrl] = useState<string>('');
    const [compressedUrl, setCompressedUrl] = useState<string>('');
    const [compressedThumbUrl, setCompressedThumbUrl] = useState<string>('');

    const handleDescriptionChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
        setDescription(value);
    };

    useEffect(() => {
        if (!imageBlob) {
            setImageUrl('');
            setCompressedUrl('');
            return;
        }
        const imageUrl = URL.createObjectURL(imageBlob);
        setImageUrl(imageUrl);
        return () => {
            URL.revokeObjectURL(imageUrl);
        };
    }, [imageBlob]);

    useEffect(() => {
        if (!compressedBlob) {
            setCompressedUrl('');
            return;
        }
        const compressedUrl = URL.createObjectURL(compressedBlob);
        setCompressedUrl(compressedUrl);
        return () => {
            URL.revokeObjectURL(compressedUrl);
        };
    }, [compressedBlob]);

    useEffect(() => {
        if (!compressedThumbBlob) {
            setCompressedThumbUrl('');
            return;
        }
        const compressedThumbUrl = URL.createObjectURL(compressedThumbBlob);
        setCompressedThumbUrl(compressedThumbUrl);
        return () => {
            URL.revokeObjectURL(compressedThumbUrl);
        };
    }, [compressedThumbBlob]);

    return (
        <>
            <Container>
                {imageUrl && imageBlob && (
                    <div>
                        <img src={imageUrl} alt="Source" />
                        <span>
                            {formatNumber(imageBlob.size)} bytes ({imageBlob.type})
                        </span>
                    </div>
                )}
                {compressedUrl && compressedBlob && (
                    <div>
                        <img src={compressedUrl} alt="Compressed" />
                        <span>
                            {formatNumber(compressedBlob.size)} bytes ({compressedBlob.type})
                        </span>
                    </div>
                )}
            </Container>
            {compressedThumbUrl && compressedThumbBlob && (
                <ThumbContainer>
                    <MaxLengthTextField label="Public description" value={description} onChange={handleDescriptionChange} fullWidth charLimit={80} />
                    <img className="thumb" src={compressedThumbUrl} alt="Compressed Thumb" />
                </ThumbContainer>
            )}
        </>
    );
};

export default Preview;
