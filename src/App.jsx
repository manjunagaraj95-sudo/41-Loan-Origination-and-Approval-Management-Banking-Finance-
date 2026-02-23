
import React, { useState, useEffect, createContext, useContext } from 'react';

// --- ROLES Configuration for RBAC ---
const ROLES = {
    ADMIN: 'ADMIN',
    LOAN_OFFICER: 'LOAN_OFFICER',
    CREDIT_ANALYST: 'CREDIT_ANALYST',
    RISK_MANAGER: 'RISK_MANAGER',
    CUSTOMER: 'CUSTOMER',
};

// --- Status Mappings ---
const LOAN_STATUS_LABELS = {
    PENDING: 'Pending Submission',
    SUBMITTED: 'Submitted',
    IN_REVIEW: 'In Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    DISBURSED: 'Disbursed',
    COMPLETED: 'Completed',
    DECLINED: 'Declined',
    DRAFT: 'Draft',
};

const LOAN_STATUS_COLORS = {
    PENDING: 'var(--status-pending)',
    SUBMITTED: 'var(--status-submitted)',
    IN_REVIEW: 'var(--status-in-review)',
    APPROVED: 'var(--status-approved)',
    REJECTED: 'var(--status-rejected)',
    DISBURSED: 'var(--status-disbursed)',
    COMPLETED: 'var(--status-completed)',
    DECLINED: 'var(--status-declined)',
    DRAFT: 'var(--status-draft)',
};

const DOCUMENT_STATUS_LABELS = {
    UPLOADED: 'Uploaded',
    PENDING_REVIEW: 'Pending Review',
    VERIFIED: 'Verified',
    REJECTED: 'Rejected',
};

const DOCUMENT_STATUS_COLORS = {
    UPLOADED: 'var(--status-submitted)',
    PENDING_REVIEW: 'var(--status-in-review)',
    VERIFIED: 'var(--status-approved)',
    REJECTED: 'var(--status-rejected)',
};

const ACTIVITY_TYPE_LABELS = {
    SUBMISSION: 'Loan Submission',
    DOCUMENT_UPLOAD: 'Document Upload',
    REVIEW_START: 'Review Started',
    ELIGIBILITY_CHECK: 'Eligibility Check',
    CREDIT_ASSESSMENT: 'Credit Assessment',
    RISK_ANALYSIS: 'Risk Analysis',
    APPROVED: 'Loan Approved',
    REJECTED: 'Loan Rejected',
    DISBURSEMENT: 'Loan Disbursement',
    COMMENT: 'Comment Added',
};

// --- Dummy Data Generation ---
const generateId = (prefix = 'ID') => `${prefix}${(Math.random() * 1e9).toFixed(0)}`;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const getRandomStatus = (statuses) => statuses[Math.floor(Math.random() * statuses.length)];

const mockCustomers = Array.from({ length: 7 }).map((_, i) => ({
    id: `CUST${i + 1}`,
    name: `Customer ${String.fromCharCode(65 + i)}`,
    email: `customer${i + 1}@example.com`,
    phone: `+1-555-${1000 + i}`,
    address: `${100 + i} Main St, Anytown, USA`,
    creditScore: (400 + Math.floor(Math.random() * 400)).toString(), // 400-800
    totalLoans: Math.floor(Math.random() * 3),
}));

const mockLoans = Array.from({ length: 15 }).map((_, i) => {
    const statusOptions = ['PENDING', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED', 'COMPLETED', 'DECLINED', 'DRAFT'];
    const currentStatus = getRandomStatus(statusOptions);
    const submittedDate = getRandomDate(new Date(2022, 0, 1), new Date());
    const approvedDate = currentStatus === 'APPROVED' || currentStatus === 'DISBURSED' || currentStatus === 'COMPLETED' ? getRandomDate(submittedDate, new Date()) : null;
    const loanOfficer = `Officer ${String.fromCharCode(65 + Math.floor(Math.random() * 3))}`; // A, B, C
    const riskScore = (Math.random() * 10).toFixed(1);

    return {
        id: `LOAN${1000 + i}`,
        applicantName: mockCustomers[Math.floor(Math.random() * mockCustomers.length)]?.name,
        amount: (25000 + Math.floor(Math.random() * 225000)).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        rawAmount: 25000 + Math.floor(Math.random() * 225000),
        status: currentStatus,
        loanType: getRandomStatus(['Personal Loan', 'Mortgage', 'Auto Loan', 'Business Loan']),
        submittedDate: submittedDate.toLocaleDateString('en-US'),
        dueDate: new Date(submittedDate.setMonth(submittedDate.getMonth() + 3 + Math.floor(Math.random() * 9))).toLocaleDateString('en-US'),
        riskScore: parseFloat(riskScore),
        assignedTo: loanOfficer,
        lastActivity: `Review started by ${loanOfficer}`,
        approvedDate: approvedDate?.toLocaleDateString('en-US') || 'N/A',
        applicationId: `APP${10000 + i}`,
        creditBureauScore: (300 + Math.floor(Math.random() * 600)).toString(),
        address: `${100 + i} Oak Ave, Metropol, USA`,
        maritalStatus: getRandomStatus(['Single', 'Married', 'Divorced']),
        employmentStatus: getRandomStatus(['Employed', 'Self-Employed', 'Unemployed']),
        income: (50000 + Math.floor(Math.random() * 150000)).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    };
});

const mockDocuments = mockLoans.flatMap(loan =>
    Array.from({ length: Math.floor(Math.random() * 3) + 2 }).map((_, i) => ({ // 2-4 documents per loan
        id: `DOC${generateId()}`,
        loanId: loan.id,
        name: `Document ${i + 1} for ${loan.applicantName}`,
        type: getRandomStatus(['ID Proof', 'Income Statement', 'Bank Statement', 'Address Proof', 'Application Form']),
        status: getRandomStatus(['UPLOADED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED']),
        uploadedBy: loan.applicantName,
        uploadedDate: getRandomDate(new Date(2023, 0, 1), new Date()).toLocaleDateString('en-US'),
        fileUrl: '#', // Dummy URL
    }))
);

const mockActivities = mockLoans.flatMap(loan => {
    const activities = [];
    const submissionTime = new Date(loan.submittedDate);

    activities.push({
        id: `ACT${generateId()}`,
        loanId: loan.id,
        description: `${ACTIVITY_TYPE_LABELS.SUBMISSION} for ${loan.applicantName}`,
        timestamp: submissionTime.toLocaleString('en-US'),
        actor: loan.applicantName,
        actionType: 'SUBMISSION',
    });

    if (loan.status !== 'PENDING' && loan.status !== 'DRAFT') {
        const docUploadTime = new Date(submissionTime.getTime() + Math.random() * 86400000); // within 1 day
        activities.push({
            id: `ACT${generateId()}`,
            loanId: loan.id,
            description: `${ACTIVITY_TYPE_LABELS.DOCUMENT_UPLOAD} by ${loan.applicantName}`,
            timestamp: docUploadTime.toLocaleString('en-US'),
            actor: loan.applicantName,
            actionType: 'DOCUMENT_UPLOAD',
        });
    }

    if (loan.status !== 'PENDING' && loan.status !== 'DRAFT' && loan.status !== 'SUBMITTED') {
        const reviewStartTime = new Date(submissionTime.getTime() + Math.random() * 86400000 * 2); // within 2 days
        activities.push({
            id: `ACT${generateId()}`,
            loanId: loan.id,
            description: `${ACTIVITY_TYPE_LABELS.REVIEW_START} by ${loan.assignedTo}`,
            timestamp: reviewStartTime.toLocaleString('en-US'),
            actor: loan.assignedTo,
            actionType: 'REVIEW_START',
        });
    }

    if (loan.status === 'APPROVED' || loan.status === 'DISBURSED' || loan.status === 'COMPLETED') {
        const approvalTime = new Date(loan.approvedDate || submissionTime); // Use approvedDate if available
        activities.push({
            id: `ACT${generateId()}`,
            loanId: loan.id,
            description: `${ACTIVITY_TYPE_LABELS.APPROVED} by Credit Analyst`,
            timestamp: approvalTime.toLocaleString('en-US'),
            actor: 'Credit Analyst',
            actionType: 'APPROVED',
        });
    } else if (loan.status === 'REJECTED' || loan.status === 'DECLINED') {
        const rejectionTime = new Date(submissionTime.getTime() + Math.random() * 86400000 * 5); // within 5 days
        activities.push({
            id: `ACT${generateId()}`,
            loanId: loan.id,
            description: `${ACTIVITY_TYPE_LABELS.REJECTED} by Risk Manager`,
            timestamp: rejectionTime.toLocaleString('en-US'),
            actor: 'Risk Manager',
            actionType: 'REJECTED',
        });
    }

    // Add some random comments
    if (Math.random() > 0.5) {
        activities.push({
            id: `ACT${generateId()}`,
            loanId: loan.id,
            description: `Discussed with applicant regarding missing document.`,
            timestamp: getRandomDate(submissionTime, new Date()).toLocaleString('en-US'),
            actor: loan.assignedTo,
            actionType: 'COMMENT',
        });
    }

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Newest first
});

const mockApprovals = mockLoans.filter(loan => loan.status === 'APPROVED' || loan.status === 'REJECTED' || loan.status === 'DECLINED' || loan.status === 'DISBURSED')
    .map(loan => ({
        id: `APPR${generateId()}`,
        loanId: loan.id,
        approver: 'Credit Analyst A',
        status: loan.status === 'APPROVED' || loan.status === 'DISBURSED' ? 'APPROVED' : 'REJECTED',
        comment: loan.status === 'APPROVED' || loan.status === 'DISBURSED' ? 'Meets all criteria' : 'Applicant credit score too low',
        approvalDate: loan.approvedDate || getRandomDate(new Date(loan.submittedDate), new Date()).toLocaleDateString('en-US'),
        role: getRandomStatus(['Credit Analyst', 'Risk Manager']),
    }));

// --- Context for User Role (simulated login) ---
const UserContext = createContext(ROLES.LOAN_OFFICER);

// --- Reusable Components ---
const StatusBadge = ({ status, type = 'loan' }) => {
    const labels = type === 'loan' ? LOAN_STATUS_LABELS : DOCUMENT_STATUS_LABELS;
    const colors = type === 'loan' ? LOAN_STATUS_COLORS : DOCUMENT_STATUS_COLORS;
    const className = `status-badge status-badge--${status?.toLowerCase().replace(/_/g, '-')}`;

    return (
        <span className={className} style={{ backgroundColor: colors[status] }}>
            {labels[status] || status}
        </span>
    );
};

const Card = ({ title, details, status, footer, onClick, className = '' }) => (
    <div className={`card ${className}`} onClick={onClick}>
        <h3 className="card__title">{title}</h3>
        {details?.map((detail, index) => (
            <p key={index} className="card__detail">
                {detail.label}: <strong>{detail.value}</strong>
            </p>
        ))}
        {status && <StatusBadge status={status} style={{ marginTop: 'var(--spacing-sm)' }} />}
        {footer && <div className="card__footer">{footer}</div>}
    </div>
);

const Button = ({ children, onClick, type = 'primary', className = '', style = {} }) => (
    <button className={`button button--${type} ${className}`} onClick={onClick} style={style}>
        {children}
    </button>
);

const ChartPlaceholder = ({ title, type }) => (
    <div className="chart-placeholder" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h4>{title} ({type} Chart)</h4>
        <p>Dynamic chart visualization not implemented.</p>
    </div>
);

// --- Screen Components ---
const DashboardScreen = ({ navigate }) => {
    const userRole = useContext(UserContext);

    // Filter loans based on common statuses for a dashboard summary
    const totalLoans = mockLoans.length;
    const pendingLoans = mockLoans.filter(loan => loan.status === 'PENDING' || loan.status === 'SUBMITTED' || loan.status === 'IN_REVIEW').length;
    const approvedLoans = mockLoans.filter(loan => loan.status === 'APPROVED' || loan.status === 'DISBURSED').length;
    const rejectedLoans = mockLoans.filter(loan => loan.status === 'REJECTED' || loan.status === 'DECLINED').length;

    const recentActivities = mockActivities.slice(0, 5); // Show top 5 recent activities

    return (
        <div className="container">
            <h2>Dashboard</h2>
            <div className="global-search-container">
                <input type="text" placeholder="Global Search..." className="global-search-input" />
            </div>

            <div className="card-grid" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <Card
                    title="Total Loans"
                    details={[{ label: 'Count', value: totalLoans }]}
                    footer="View all loans"
                    onClick={() => navigate('LOANS_LIST')}
                />
                <Card
                    title="Pending Approvals"
                    details={[{ label: 'Count', value: pendingLoans }]}
                    footer="Review applications"
                    onClick={() => navigate('LOANS_LIST', { status: 'PENDING' })}
                    status="PENDING"
                />
                <Card
                    title="Approved Loans"
                    details={[{ label: 'Count', value: approvedLoans }]}
                    footer="View approved"
                    onClick={() => navigate('LOANS_LIST', { status: 'APPROVED' })}
                    status="APPROVED"
                />
                <Card
                    title="Rejected Loans"
                    details={[{ label: 'Count', value: rejectedLoans }]}
                    footer="Review reasons"
                    onClick={() => navigate('LOANS_LIST', { status: 'REJECTED' })}
                    status="REJECTED"
                />
            </div>

            <h3>Loan Pipeline Overview</h3>
            <div className="card-grid">
                <ChartPlaceholder title="Loan Applications by Type" type="Donut" />
                <ChartPlaceholder title="Monthly Loan Approvals" type="Line" />
                <ChartPlaceholder title="Average Processing Time" type="Gauge" />
                <ChartPlaceholder title="Risk Score Distribution" type="Bar" />
            </div>

            <h3 style={{ marginTop: 'var(--spacing-xl)' }}>Recent Activities</h3>
            <div className="recent-activities-panel">
                {recentActivities?.length === 0 ? (
                    <p>No recent activities.</p>
                ) : (
                    recentActivities?.map(activity => (
                        <div
                            key={activity?.id}
                            className="activity-card"
                            onClick={() => navigate('LOAN_DETAIL', { loanId: activity?.loanId })}
                        >
                            <div className="activity-card__header">
                                <span className="activity-card__title">{ACTIVITY_TYPE_LABELS[activity?.actionType] || activity?.actionType}</span>
                                <span className="activity-card__timestamp">{activity?.timestamp}</span>
                            </div>
                            <p className="activity-card__description">{activity?.description}</p>
                            <span className="activity-card__meta">Actor: {activity?.actor} | Loan ID: {activity?.loanId}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const LoansListScreen = ({ navigate, params }) => {
    const userRole = useContext(UserContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState(params?.status || '');
    const [sortOrder, setSortOrder] = useState('newest');

    const filteredLoans = mockLoans
        ?.filter(loan => {
            const matchesSearch = loan?.applicantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                loan?.loanType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                loan?.id?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus ? loan?.status === filterStatus : true;
            return matchesSearch && matchesStatus;
        })
        ?.sort((a, b) => {
            if (sortOrder === 'newest') return new Date(b?.submittedDate).getTime() - new Date(a?.submittedDate).getTime();
            if (sortOrder === 'oldest') return new Date(a?.submittedDate).getTime() - new Date(b?.submittedDate).getTime();
            if (sortOrder === 'amount_desc') return b?.rawAmount - a?.rawAmount;
            if (sortOrder === 'amount_asc') return a?.rawAmount - b?.rawAmount;
            return 0;
        });

    return (
        <div className="container">
            <h2>Loan Applications</h2>
            <div className="grid-controls">
                <input
                    type="text"
                    placeholder="Search by Applicant, ID, Type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="global-search-input"
                    style={{ flex: '2 1 200px' }}
                />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ flex: '1 1 150px' }}>
                    <option value="">All Statuses</option>
                    {Object.keys(LOAN_STATUS_LABELS).map(status => (
                        <option key={status} value={status}>{LOAN_STATUS_LABELS[status]}</option>
                    ))}
                </select>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ flex: '1 1 150px' }}>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount_desc">Amount (High to Low)</option>
                    <option value="amount_asc">Amount (Low to High)</option>
                </select>
                <Button onClick={() => alert('Exporting loans to Excel/PDF')} type="secondary" style={{ flex: '0 0 auto' }}>Export</Button>
            </div>

            <div className="card-grid">
                {(filteredLoans?.length === 0) ? (
                    <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                        <p>No loans found matching your criteria.</p>
                        <Button onClick={() => { setSearchTerm(''); setFilterStatus(''); setSortOrder('newest'); }}>Clear Filters</Button>
                    </div>
                ) : (
                    filteredLoans?.map(loan => (
                        <Card
                            key={loan?.id}
                            title={loan?.applicantName}
                            details={[
                                { label: 'Loan ID', value: loan?.id },
                                { label: 'Amount', value: loan?.amount },
                                { label: 'Type', value: loan?.loanType },
                            ]}
                            status={loan?.status}
                            footer={<span>Submitted: {loan?.submittedDate} | Assigned: {loan?.assignedTo}</span>}
                            onClick={() => navigate('LOAN_DETAIL', { loanId: loan?.id })}
                            className={(loan?.status === 'PENDING' || loan?.status === 'IN_REVIEW') ? 'live-pulse' : ''}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

const LoanDetailScreen = ({ navigate, params }) => {
    const loan = mockLoans.find(l => l?.id === params?.loanId);
    const relatedDocuments = mockDocuments.filter(doc => doc?.loanId === params?.loanId);
    const relatedActivities = mockActivities.filter(activity => activity?.loanId === params?.loanId);
    const relatedApprovals = mockApprovals.filter(approval => approval?.loanId === params?.loanId);
    const userRole = useContext(UserContext);

    if (!loan) {
        return (
            <div className="container">
                <h2>Loan Not Found</h2>
                <p>The loan you are looking for does not exist.</p>
                <Button onClick={() => navigate('LOANS_LIST')}>Back to Loans List</Button>
            </div>
        );
    }

    const handleApprove = () => {
        alert(`Loan ${loan?.id} for ${loan?.applicantName} has been approved.`);
        // In a real app, this would dispatch an action to update state/backend.
        navigate('LOANS_LIST', { status: 'APPROVED' });
    };

    const handleReject = () => {
        alert(`Loan ${loan?.id} for ${loan?.applicantName} has been rejected.`);
        // In a real app, this would dispatch an action to update state/backend.
        navigate('LOANS_LIST', { status: 'REJECTED' });
    };

    const handleEdit = () => {
        alert(`Editing Loan ${loan?.id}. (Form not implemented)`);
    };

    const canApproveReject = (userRole === ROLES.ADMIN || userRole === ROLES.CREDIT_ANALYST || userRole === ROLES.RISK_MANAGER);
    const canEdit = (userRole === ROLES.ADMIN || userRole === ROLES.LOAN_OFFICER) && (loan.status === 'DRAFT' || loan.status === 'PENDING');

    return (
        <div className="container">
            <div className="detail-view">
                <div className="detail-view__header">
                    <h2>Loan Application: {loan?.applicantName} ({loan?.id})</h2>
                    <StatusBadge status={loan?.status} type="loan" />
                </div>

                <div className="detail-view__section">
                    <h3 className="detail-view__section-title">Loan Details</h3>
                    <div className="detail-view__item">
                        <span className="detail-view__item-label">Application ID:</span>
                        <span className="detail-view__item-value">{loan?.applicationId}</span>
                    </div>
                    <div className="detail-view__item">
                        <span className="detail-view__item-label">Amount:</span>
                        <span className="detail-view__item-value">{loan?.amount}</span>
                    </div>
                    <div className="detail-view__item">
                        <span className="detail-view__item-label">Loan Type:</span>
                        <span className="detail-view__item-value">{loan?.loanType}</span>
                    </div>
                    <div className="detail-view__item">
                        <span className="detail-view__item-label">Submitted On:</span>
                        <span className="detail-view__item-value">{loan?.submittedDate}</span>
                    </div>
                    <div className="detail-view__item">
                        <span className="detail-view__item-label">Due Date:</span>
                        <span className="detail-view__item-value">{loan?.dueDate}</span>
                    </div>
                    <div className="detail-view__item">
                        <span className="detail-view__item-label">Assigned To:</span>
                        <span className="detail-view__item-value">{loan?.assignedTo}</span>
                    </div>
                    <div className="detail-view__item">
                        <span className="detail-view__item-label">Risk Score:</span>
                        <span className="detail-view__item-value">{loan?.riskScore}</span>
                    </div>
                </div>

                <div className="detail-view__section">
                    <h3 className="detail-view__section-title">Applicant Information</h3>
                    <div className="detail-view__item">
                        <span className="detail-view__item-label">Applicant Name:</span>
                        <span className="detail-view__item-value">{loan?.applicantName}</span>
                    </div>
                    <div className="detail-view__item">
                        <span className="detail-view__item-label">Credit Bureau Score:</span>
                        <span className="detail-view__item-value">{loan?.creditBureauScore}</span>
                    </div>
                    <div className="detail-view__item">
                        <span className="detail-view__item-label">Address:</span>
                        <span className="detail-view__item-value">{loan?.address}</span>
                    </div>
                    <div className="detail-view__item">
                        <span className="detail-view__item-label">Marital Status:</span>
                        <span className="detail-view__item-value">{loan?.maritalStatus}</span>
                    </div>
                    <div className="detail-view__item">
                        <span className="detail-view__item-label">Employment Status:</span>
                        <span className="detail-view__item-value">{loan?.employmentStatus}</span>
                    </div>
                    <div className="detail-view__item">
                        <span className="detail-view__item-label">Annual Income:</span>
                        <span className="detail-view__item-value">{loan?.income}</span>
                    </div>
                </div>

                <div className="detail-view__section">
                    <h3 className="detail-view__section-title">Required Documents</h3>
                    {relatedDocuments?.length === 0 ? (
                        <p>No documents uploaded yet.</p>
                    ) : (
                        <div className="card-grid">
                            {relatedDocuments.map(doc => (
                                <Card
                                    key={doc?.id}
                                    title={doc?.name}
                                    details={[
                                        { label: 'Type', value: doc?.type },
                                        { label: 'Uploaded By', value: doc?.uploadedBy },
                                        { label: 'Uploaded On', value: doc?.uploadedDate },
                                    ]}
                                    status={doc?.status}
                                    footer={<a href={doc?.fileUrl} target="_blank" rel="noopener noreferrer">View Document</a>}
                                    onClick={() => alert(`Previewing document: ${doc?.name}`)} // Simulate document preview
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="detail-view__section">
                    <h3 className="detail-view__section-title">Approval History</h3>
                    {relatedApprovals?.length === 0 ? (
                        <p>No approval decisions yet.</p>
                    ) : (
                        <div className="card-grid">
                            {relatedApprovals.map(approval => (
                                <Card
                                    key={approval?.id}
                                    title={`Approval by ${approval?.approver}`}
                                    details={[
                                        { label: 'Role', value: approval?.role },
                                        { label: 'Decision', value: LOAN_STATUS_LABELS[approval?.status] },
                                        { label: 'Date', value: approval?.approvalDate },
                                        { label: 'Comment', value: approval?.comment },
                                    ]}
                                    status={approval?.status}
                                    onClick={() => alert(`Approval details for ${approval?.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="detail-view__section">
                    <h3 className="detail-view__section-title">Activity Log</h3>
                    {relatedActivities?.length === 0 ? (
                        <p>No activities recorded for this loan.</p>
                    ) : (
                        <div className="recent-activities-panel" style={{ boxShadow: 'none' }}>
                            {relatedActivities.map(activity => (
                                <div key={activity?.id} className="activity-card" style={{ cursor: 'default' }}>
                                    <div className="activity-card__header">
                                        <span className="activity-card__title">{ACTIVITY_TYPE_LABELS[activity?.actionType] || activity?.actionType}</span>
                                        <span className="activity-card__timestamp">{activity?.timestamp}</span>
                                    </div>
                                    <p className="activity-card__description">{activity?.description}</p>
                                    <span className="activity-card__meta">Actor: {activity?.actor}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="detail-view__actions">
                    {canEdit && <Button onClick={handleEdit} type="secondary">Edit Loan Application</Button>}
                    {canApproveReject && (
                        (loan?.status === 'IN_REVIEW' || loan?.status === 'SUBMITTED' || loan?.status === 'PENDING') && (
                            <>
                                <Button onClick={handleApprove} type="primary">Approve Loan</Button>
                                <Button onClick={handleReject} type="danger">Reject Loan</Button>
                            </>
                        )
                    )}
                    <Button onClick={() => navigate('LOANS_LIST')} type="secondary">Back to List</Button>
                </div>
            </div>
        </div>
    );
};


const ActivityLogsScreen = ({ navigate }) => {
    const userRole = useContext(UserContext);
    // RBAC: Admin sees all, Loan Officer/Credit Analyst might see relevant activities
    const visibleActivities = userRole === ROLES.ADMIN
        ? mockActivities
        : mockActivities.filter(a => (a?.actor === 'Credit Analyst' || a?.actor === 'Loan Officer' || a?.actor === 'Risk Manager') || a?.loanId); // Simplified filter for non-admin

    return (
        <div className="container">
            <h2>System Activity Logs</h2>
            <div className="recent-activities-panel">
                {visibleActivities?.length === 0 ? (
                    <p>No activities visible for your role.</p>
                ) : (
                    visibleActivities?.map(activity => (
                        <div
                            key={activity?.id}
                            className="activity-card"
                            onClick={() => (activity?.loanId ? navigate('LOAN_DETAIL', { loanId: activity?.loanId }) : alert('No specific loan context for this activity.'))}
                        >
                            <div className="activity-card__header">
                                <span className="activity-card__title">{ACTIVITY_TYPE_LABELS[activity?.actionType] || activity?.actionType}</span>
                                <span className="activity-card__timestamp">{activity?.timestamp}</span>
                            </div>
                            <p className="activity-card__description">{activity?.description}</p>
                            <span className="activity-card__meta">Actor: {activity?.actor} {activity?.loanId && `| Loan ID: ${activity?.loanId}`}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const SettingsScreen = ({ navigate }) => {
    const userRole = useContext(UserContext);
    return (
        <div className="container">
            <div className="detail-view">
                <h2>Settings</h2>
                <p>User preferences and application settings would be managed here.</p>
                <div className="detail-view__section">
                    <h3 className="detail-view__section-title">User Profile</h3>
                    <div className="detail-view__item">
                        <span className="detail-view__item-label">Current Role:</span>
                        <span className="detail-view__item-value">{userRole}</span>
                    </div>
                    <Button onClick={() => alert('Profile saved!')}>Update Profile</Button>
                </div>
                <div className="detail-view__actions">
                    <Button onClick={() => navigate('DASHBOARD')} type="secondary">Back to Dashboard</Button>
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---
function App() {
    const [view, setView] = useState({
        screen: 'DASHBOARD',
        params: {},
        path: [{ screen: 'DASHBOARD', label: 'Dashboard' }],
    });
    const [currentUserRole, setCurrentUserRole] = useState(ROLES.LOAN_OFFICER); // Default role

    const navigate = (screen, params = {}) => {
        let newPath = [...view.path];

        // Simplified breadcrumb management for this specific case
        let breadcrumbs = [{ screen: 'DASHBOARD', label: 'Dashboard' }];
        if (screen === 'LOANS_LIST') {
            breadcrumbs.push({ screen: 'LOANS_LIST', label: 'Loans', params: params });
        } else if (screen === 'LOAN_DETAIL') {
            breadcrumbs.push({ screen: 'LOANS_LIST', label: 'Loans' });
            breadcrumbs.push({ screen: 'LOAN_DETAIL', label: `Loan ${params?.loanId}`, params: params });
        } else if (screen === 'ACTIVITY_LOGS') {
            breadcrumbs.push({ screen: 'ACTIVITY_LOGS', label: 'Activity Logs', params: params });
        } else if (screen === 'SETTINGS') {
            breadcrumbs.push({ screen: 'SETTINGS', label: 'Settings', params: params });
        }

        // Handle cases where a specific status might be part of the breadcrumb for LOANS_LIST
        if (screen === 'LOANS_LIST' && params?.status) {
            const loansBreadcrumb = breadcrumbs.find(b => b.screen === 'LOANS_LIST');
            if (loansBreadcrumb) {
                loansBreadcrumb.label = `Loans (${LOAN_STATUS_LABELS[params.status] || params.status})`;
            }
        }


        setView({ screen, params, path: breadcrumbs });
    };

    const handleLogout = () => {
        alert('Logging out...');
        // In a real app, clear auth tokens, redirect to login, etc.
        setCurrentUserRole(null); // Simulate logout state, could be 'GUEST'
        setView({ screen: 'DASHBOARD', params: {}, path: [{ screen: 'DASHBOARD', label: 'Dashboard' }] });
    };

    const handleRoleChange = (e) => {
        setCurrentUserRole(e.target.value);
        navigate('DASHBOARD'); // Navigate to dashboard on role change
    };

    const renderScreen = () => {
        // RBAC enforcement at screen level
        const allowedScreens = {
            [ROLES.ADMIN]: ['DASHBOARD', 'LOANS_LIST', 'LOAN_DETAIL', 'ACTIVITY_LOGS', 'SETTINGS'],
            [ROLES.LOAN_OFFICER]: ['DASHBOARD', 'LOANS_LIST', 'LOAN_DETAIL'],
            [ROLES.CREDIT_ANALYST]: ['DASHBOARD', 'LOANS_LIST', 'LOAN_DETAIL'],
            [ROLES.RISK_MANAGER]: ['DASHBOARD', 'LOANS_LIST', 'LOAN_DETAIL'],
            [ROLES.CUSTOMER]: ['DASHBOARD', 'LOANS_LIST'], // Limited view for customer
            null: ['DASHBOARD'], // For logged out state, limited access
        };

        if (!currentUserRole || !allowedScreens[currentUserRole]?.includes(view?.screen)) {
            return (
                <div className="container" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                    <h1>Access Denied</h1>
                    <p>You do not have permission to view this page with your current role.</p>
                    <Button onClick={() => navigate('DASHBOARD')}>Go to Dashboard</Button>
                    {currentUserRole && <Button onClick={handleLogout} type="secondary" style={{ marginLeft: 'var(--spacing-md)' }}>Logout</Button>}
                </div>
            );
        }

        switch (view?.screen) {
            case 'DASHBOARD':
                return <DashboardScreen navigate={navigate} />;
            case 'LOANS_LIST':
                return <LoansListScreen navigate={navigate} params={view?.params} />;
            case 'LOAN_DETAIL':
                return <LoanDetailScreen navigate={navigate} params={view?.params} />;
            case 'ACTIVITY_LOGS':
                return <ActivityLogsScreen navigate={navigate} />;
            case 'SETTINGS':
                return <SettingsScreen navigate={navigate} />;
            default:
                return (
                    <div className="container">
                        <h2>404 - Screen Not Found</h2>
                        <Button onClick={() => navigate('DASHBOARD')}>Go to Dashboard</Button>
                    </div>
                );
        }
    };

    return (
        <UserContext.Provider value={currentUserRole}>
            <div className="App">
                <header className="header">
                    <div className="header__logo">LoanFlow</div>
                    <nav className="header__nav">
                        <button className="header__nav-item" onClick={() => navigate('DASHBOARD')}>Dashboard</button>
                        <button className="header__nav-item" onClick={() => navigate('LOANS_LIST')}>Loans</button>
                        <button className="header__nav-item" onClick={() => navigate('ACTIVITY_LOGS')}>Activity Logs</button>
                        <button className="header__nav-item" onClick={() => navigate('SETTINGS')}>Settings</button>
                    </nav>
                    <div className="header__user-info">
                        <label htmlFor="role-select">Role:</label>
                        <select id="role-select" value={currentUserRole || ''} onChange={handleRoleChange}>
                            {Object.values(ROLES).map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                            <option value="">Guest (Logged Out)</option>
                        </select>
                        <Button onClick={handleLogout} type="danger">Logout</Button>
                    </div>
                </header>

                <div className="breadcrumbs">
                    {view?.path?.map((item, index) => (
                        <span key={item?.screen + (item?.params ? JSON.stringify(item.params) : '') + index} className="breadcrumbs__item">
                            {index < view.path.length - 1 ? (
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); navigate(item?.screen, item?.params); }}
                                    className="breadcrumbs__item-link"
                                >
                                    {item?.label}
                                </a>
                            ) : (
                                <span className="breadcrumbs__item--active">{item?.label}</span>
                            )}
                        </span>
                    ))}
                </div>

                <main className="main-content">
                    {renderScreen()}
                </main>
            </div>
        </UserContext.Provider>
    );
}

export default App;