import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'next-i18next';
import type { Team } from '@prisma/client';
import { Card } from '@/components/shared';
import ButtonFromTheme from '../shared/ButtonFromTheme';
import Switch from '../shared/Switch';
import { useVendors as useVendorsHook } from 'hooks/useVendors';
import { useVendorSettings } from 'utils/tenantAccess';

const FarmVendors = ({ team }: { team: Team }) => {
    const { t } = useTranslation('common');
    const { isTeamUsingVendors, isLoading: settingsLoading, updateVendorSettings } = useVendorSettings({ teamSlug: team.slug });
    const [localUseVendors, setLocalUseVendors] = useState(false);
    const [loading, setLoading] = useState(false);
    const { vendors, isLoading: vendorsLoading } = useVendorsHook(team.slug);


    useEffect(() => {
        if (isTeamUsingVendors !== null) {
            setLocalUseVendors(isTeamUsingVendors);
        }
    }, [isTeamUsingVendors]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            await updateVendorSettings(localUseVendors);
            toast.success(t('successfully-updated'));
        } catch (error: any) {
            toast.error(error.message || t('error-updating-settings'));
        } finally {
            window.location.reload();
            setLoading(false);
        }
    };

    const handleToggle = (id, value) => {
        setLocalUseVendors(value);
    };

    const vendorCount = vendors?.length || 0;

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <Card.Body>
                    <Card.Header>
                        <Card.Title>{t('Vendors Management')}</Card.Title>
                        <Card.Description>
                            {t('Enable vendor management for your farm operations')}
                        </Card.Description>
                    </Card.Header>
                    <div className="mt-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-700">
                                {t('Use Vendors?')}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {t('Enable to track and manage farm vendors')}
                            </p>
                            {!vendorsLoading && vendorCount > 0 && (
                                <p className="mt-1 text-xs text-blue-600">
                                    {t('You currently have')} {vendorCount} {vendorCount === 1 ? t('vendor') : t('vendors')}
                                </p>
                            )}
                        </div>
                        {!settingsLoading ?
                            <Switch
                                setCheckedUser={handleToggle}
                                userId=""
                                isActive={localUseVendors}
                            /> : <></>}
                    </div>
                </Card.Body>
                <Card.Footer>
                    <ButtonFromTheme
                        loading={loading || settingsLoading}
                        type="submit"
                        disabled={settingsLoading || localUseVendors === isTeamUsingVendors}
                    >
                        {t('save-changes')}
                    </ButtonFromTheme>
                </Card.Footer>
            </Card>
        </form>
    );
};

export default FarmVendors;
