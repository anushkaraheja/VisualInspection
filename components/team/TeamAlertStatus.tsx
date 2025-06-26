import { useState, useEffect } from 'react';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import { PlusIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import useOrgTheme from 'hooks/useOrgTheme';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useTeamStatus } from 'hooks/useTeamStatus';
import Card from '@/components/shared/Card';
import { toast } from '@/lib/toast';

// Import icons to display in the selection 
import { 
  BellIcon, ClockIcon, CheckCircleIcon, XCircleIcon, EyeIcon, 
  FlagIcon, ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

// Map of icon names to actual icon components
const ICON_MAP = {
  'alert-circle': <ExclamationCircleIcon className="h-6 w-6" />,
  'check-circle': <CheckCircleIcon className="h-6 w-6" />,
  'x-circle': <XCircleIcon className="h-6 w-6" />,
  'clock': <ClockIcon className="h-6 w-6" />,
  'bell': <BellIcon className="h-6 w-6" />,
  'eye': <EyeIcon className="h-6 w-6" />,
  'flag': <FlagIcon className="h-6 w-6" />,
  'alert-triangle': <ExclamationTriangleIcon className="h-6 w-6" />,
};

interface Team {
    id: string;
    name: string;
    slug: string;
}

interface TeamAlertStatusProps {
    team: Team;
}

interface StatusFormData {
    id?: string;
    name: string;
    code: string;
    description: string;
    color: string;
    icon: string;
    order: number;
    isDefault: boolean;
}

const DEFAULT_COLORS = [
    '#2563EB', // Blue
    '#22C55E', // Green
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#6B7280', // Gray
    '#18181B', // Zinc
];

const DEFAULT_ICONS = [
    'alert-circle',
    'check-circle',
    'x-circle',
    'clock',
    'bell',
    'eye',
    'flag',
    'alert-triangle',
];

// Validation schema using Yup
const StatusSchema = Yup.object().shape({
    name: Yup.string()
        .min(2, 'Too Short!')
        .max(50, 'Too Long!')
        .required('Required'),
    code: Yup.string()
        .matches(/^[A-Z0-9_]+$/, 'Only uppercase letters, numbers and underscores are allowed')
        .required('Required'),
    description: Yup.string().max(200, 'Too Long!'),
    color: Yup.string().matches(/^#([0-9A-F]{3}){1,2}$/i, 'Invalid color format'),
    icon: Yup.string().required('Required'),
    order: Yup.number().min(0, 'Must be positive').required('Required'),
    isDefault: Yup.boolean(),
});

export default function TeamAlertStatus({ team }: TeamAlertStatusProps) {
    const { t } = useTranslation('common');
    const { theme } = useOrgTheme();
    const [initialValues, setInitialValues] = useState<StatusFormData>({
        name: '',
        code: '',
        description: '',
        color: DEFAULT_COLORS[0],
        icon: DEFAULT_ICONS[0],
        order: 0,
        isDefault: false,
    });

    const {
        statuses,
        isLoading,
        error,
        selectedStatus,
        isModalOpen,
        isDeleteModalOpen,
        isEditing,
        createStatus,
        createDefaultStatuses,
        updateStatus,
        deleteStatus,
        openCreateModal,
        openEditModal,
        openDeleteModal,
        closeModal,
        closeDeleteModal,
    } = useTeamStatus(team.slug);

    // Function to add default statuses
    const addDefaultStatuses = async () => {
        const defaultStatuses = [
            {
                name: t('status-default-pending'),
                code: 'PENDING',
                description: t('status-default-pending-desc'),
                color: '#F59E0B', // Amber
                icon: 'clock',
                order: 0,
                isDefault: true,
            },
            {
                name: t('status-default-in-progress'),
                code: 'IN_PROGRESS',
                description: t('status-default-in-progress-desc'),
                color: '#3498DB', // Blue
                icon: 'alert-circle',
                order: 1,
                isDefault: false,
            },
            {
                name: t('status-default-resolved'),
                code: 'RESOLVED',
                description: t('status-default-resolved-desc'),
                color: '#22C55E', // Green
                icon: 'check-circle',
                order: 2,
                isDefault: false,
            },
        ];

        const success = await createDefaultStatuses(defaultStatuses);
        
        if (success) {
            toast.success(t('default-statuses-created'));
        }
    };

    useEffect(() => {
        if (selectedStatus && isEditing) {
            setInitialValues({
                id: selectedStatus.id,
                name: selectedStatus.name,
                code: selectedStatus.code,
                description: selectedStatus.description || '',
                color: selectedStatus.color || DEFAULT_COLORS[0],
                icon: selectedStatus.icon || DEFAULT_ICONS[0],
                order: selectedStatus.order || 0,
                isDefault: selectedStatus.isDefault || false,
            });
        } else {
            resetForm();
        }
    }, [selectedStatus, isEditing]);

    const resetForm = () => {
        setInitialValues({
            name: '',
            code: '',
            description: '',
            color: DEFAULT_COLORS[0],
            icon: DEFAULT_ICONS[0],
            order: statuses.length,
            isDefault: false,
        });
    };

    const handleSubmit = async (values: StatusFormData) => {
        if (isEditing && selectedStatus) {
            await updateStatus(selectedStatus.id, values);
        } else {
            await createStatus(values);
        }
        closeModal();
    };

    const handleDelete = async () => {
        if (selectedStatus) {
            await deleteStatus(selectedStatus.id);
            closeDeleteModal();
        }
    };

    if (isLoading) return <div className="p-4">{t('loading')}</div>;
    if (error) return <div className="p-4 text-red-500">{t('error-loading-statuses')}</div>;

    // Empty state with instructions when no statuses exist
    if (statuses.length === 0) {
        return (
            <Card>
                <Card.Body>
                    <div className="flex justify-between items-center mb-6">
                        <Card.Header>
                            <Card.Title>{t('alert-statuses')}</Card.Title>
                            <Card.Description>{t('compliance-status-description')}</Card.Description>
                        </Card.Header>
                    </div>
                    
                    <div className="text-center py-10">
                        <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <ExclamationCircleIcon className="h-12 w-12 text-gray-400" aria-hidden="true" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('no-statuses-defined')}</h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                            {t('no-statuses-message')}
                        </p>
                        <div className="mt-6 flex flex-col items-center space-y-4">
                            <ButtonFromTheme
                                onClick={openCreateModal}
                                className="gap-2"
                                icon={<PlusIcon className="h-5 w-5" aria-hidden="true" />}
                            >
                                {t('add-your-first-status')}
                            </ButtonFromTheme>
                            <div className="flex items-center">
                                <div className="mx-4 border-t border-gray-300 flex-grow"></div>
                                <span className="text-sm text-gray-500">{t('or')}</span>
                                <div className="mx-4 border-t border-gray-300 flex-grow"></div>
                            </div>
                            <ButtonFromTheme
                                onClick={addDefaultStatuses}
                                outline
                                className="gap-2"
                                icon={<CheckCircleIcon className="h-5 w-5" aria-hidden="true" />}
                            >
                                {t('add-default-statuses')}
                            </ButtonFromTheme>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    // Regular view when statuses exist
    return (
        <Card>
            <Card.Body>
                <div className="flex justify-between items-center mb-6">
                    <Card.Header>
                        <Card.Title>{t('alert-statuses')}</Card.Title>
                        <Card.Description>{t('compliance-status-description')}</Card.Description>
                    </Card.Header>
                    <ButtonFromTheme
                        size="sm"
                        onClick={openCreateModal}
                        className="gap-2"
                        icon={<PlusIcon className="h-5 w-5" aria-hidden="true" />}
                    >
                        {t('add-status')}
                    </ButtonFromTheme>
                </div>

                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>{t('status')}</th>
                                <th>{t('code')}</th>
                                <th>{t('description')}</th>
                                <th>{t('default')}</th>
                                <th className="text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statuses.map((status) => (
                                <tr key={status.id}>
                                    <td className="flex items-center gap-2">
                                        <span
                                            className="badge w-3 h-3 rounded-full"
                                            style={{ backgroundColor: status.color || theme.primaryColor || '#CBD5E1' }}
                                        ></span>
                                        <span className="font-medium">{status.name}</span>
                                    </td>
                                    <td>{status.code}</td>
                                    <td>{status.description || '-'}</td>
                                    <td>
                                        {status.isDefault ?
                                            <span className="badge badge-success badge-sm">{t('yes')}</span> :
                                            <span className="badge badge-ghost badge-sm">{t('no')}</span>
                                        }
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end space-x-2">
                                            <ButtonFromTheme
                                                size="sm"
                                                onClick={() => openEditModal(status)}
                                                outline
                                            >
                                                {<PencilIcon className="h-4 w-4" aria-hidden="true" />}
                                            </ButtonFromTheme>
                                            <ButtonFromTheme
                                                size="sm"
                                                onClick={() => openDeleteModal(status)}
                                                disabled={status.isDefault}
                                                secondaryColor="#EF4444"
                                                outline
                                            >
                                                {<TrashIcon className="h-4 w-4" aria-hidden="true" />}
                                            </ButtonFromTheme>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Add/Edit Status Modal - Using DaisyUI modal with Formik */}
                {isModalOpen && (
                    <div className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg">
                                {isEditing ? t('edit-status') : t('add-status')}
                            </h3>

                            <Formik
                                initialValues={initialValues}
                                validationSchema={StatusSchema}
                                onSubmit={handleSubmit}
                                enableReinitialize
                            >
                                {({ values, errors, touched, setFieldValue, handleBlur }) => (
                                    <Form className="mt-4 space-y-4">
                                        <div className="form-control w-full">
                                            <label htmlFor="name" className="label">
                                                <span className="label-text">{t('status-name')}</span>
                                            </label>
                                            <Field
                                                type="text"
                                                name="name"
                                                id="name"
                                                className="input input-bordered w-full"
                                            />
                                            <ErrorMessage name="name" component="div" className="text-error text-xs mt-1" />
                                        </div>

                                        <div className="form-control w-full">
                                            <label htmlFor="code" className="label">
                                                <span className="label-text">{t('status-code')}</span>
                                            </label>
                                            <Field
                                                type="text"
                                                name="code"
                                                id="code"
                                                className="input input-bordered w-full uppercase"
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const upperValue = e.target.value.toUpperCase();
                                                    setFieldValue('code', upperValue);
                                                }}
                                            />
                                            <label className="label">
                                                <span className="label-text-alt">{t('status-code-description')}</span>
                                            </label>
                                            <ErrorMessage name="code" component="div" className="text-error text-xs mt-1" />
                                        </div>

                                        <div className="form-control w-full">
                                            <label htmlFor="description" className="label">
                                                <span className="label-text">{t('description')}</span>
                                            </label>
                                            <Field
                                                as="textarea"
                                                name="description"
                                                id="description"
                                                rows={2}
                                                className="textarea textarea-bordered w-full"
                                            />
                                            <ErrorMessage name="description" component="div" className="text-error text-xs mt-1" />
                                        </div>

                                        <div className="form-control w-full">
                                            <label htmlFor="color" className="label">
                                                <span className="label-text">{t('color')}</span>
                                            </label>
                                            <div className="flex space-x-2">
                                                <Field
                                                    type="color"
                                                    name="color"
                                                    id="color"
                                                    className="h-10 w-10 rounded-md"
                                                />
                                                <Field
                                                    type="text"
                                                    name="color"
                                                    className="input input-bordered flex-1"
                                                />
                                            </div>
                                            <ErrorMessage name="color" component="div" className="text-error text-xs mt-1" />
                                        </div>

                                        <div className="form-control w-full">
                                            <label htmlFor="icon" className="label">
                                                <span className="label-text">{t('icon')}</span>
                                            </label>
                                            <div className="grid grid-cols-4 gap-3 mt-2">
                                                {Object.entries(ICON_MAP).map(([iconName, iconComponent]) => (
                                                    <div 
                                                        key={iconName}
                                                        onClick={() => setFieldValue('icon', iconName)}
                                                        className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                                            values.icon === iconName 
                                                                ? 'border-primary bg-primary/10 dark:border-primary dark:bg-primary/20' 
                                                                : 'border-gray-200 dark:border-gray-700'
                                                        }`}
                                                    >
                                                        <div className="text-gray-700 dark:text-gray-300">
                                                            {iconComponent}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <input type="hidden" name="icon" value={values.icon} />
                                            <ErrorMessage name="icon" component="div" className="text-error text-xs mt-1" />
                                        </div>

                                        <div className="form-control w-full">
                                            <label htmlFor="order" className="label">
                                                <span className="label-text">{t('display-order')}</span>
                                            </label>
                                            <Field
                                                type="number"
                                                name="order"
                                                id="order"
                                                min="0"
                                                className="input input-bordered w-full"
                                            />
                                            <ErrorMessage name="order" component="div" className="text-error text-xs mt-1" />
                                        </div>

                                        <div className="form-control">
                                            <label className="label cursor-pointer">
                                                <div className="flex flex-col">
                                                    <span className="label-text font-medium">{t('set-as-default')}</span>
                                                    <span className="label-text-alt">{t('default-status-description')}</span>
                                                </div>
                                                <Field
                                                    type="checkbox"
                                                    name="isDefault"
                                                    className="checkbox"
                                                />
                                            </label>
                                            <ErrorMessage name="isDefault" component="div" className="text-error text-xs mt-1" />
                                        </div>

                                        <div className="modal-action">
                                            <ButtonFromTheme
                                                outline
                                                type="button"
                                                onClick={closeModal}
                                            >
                                                {t('cancel')}
                                            </ButtonFromTheme>
                                            <ButtonFromTheme
                                                type="submit"
                                            >
                                                {isEditing ? t('update') : t('create')}
                                            </ButtonFromTheme>
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        </div>
                        <div className="modal-backdrop" onClick={closeModal}></div>
                    </div>
                )}

                {/* Delete Confirmation Modal - Using DaisyUI modal */}
                {isDeleteModalOpen && selectedStatus && (
                    <div className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg">{t('confirm-delete')}</h3>
                            <p className="py-4">
                                {t('delete-status-confirmation', { status: selectedStatus.name })}
                            </p>
                            <div className="modal-action">
                                <ButtonFromTheme
                                    outline
                                    onClick={closeDeleteModal}
                                >
                                    {t('cancel')}
                                </ButtonFromTheme>
                                <ButtonFromTheme
                                    secondaryColor="#EF4444"
                                    onClick={handleDelete}
                                >
                                    {t('delete')}
                                </ButtonFromTheme>
                            </div>
                        </div>
                        <div className="modal-backdrop" onClick={closeDeleteModal}></div>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}
