import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Container, Row, Col, Card, Table, Pagination,
  Button, Badge, Form, Alert, Spinner, ButtonGroup
} from 'react-bootstrap';
import axios from 'axios';
import { Store } from '../Store';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { getError } from '../utils';

// Period helpers
const getPeriodDates = (period) => {
  const now = new Date();
  let start, end;
  end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case 'daily':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay()); // Sunday
      start.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarterly':
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1);
      break;
    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return null;
  }
  return { startDate: start.toISOString(), endDate: end.toISOString() };
};

const PERIODS = [
  { key: 'all',       label: '📋 All Time' },
  { key: 'daily',     label: '📅 Today' },
  { key: 'weekly',    label: '📆 This Week' },
  { key: 'monthly',   label: '🗓 This Month' },
  { key: 'quarterly', label: '📊 This Quarter' },
  { key: 'yearly',    label: '🗃 This Year' },
];

const IncomeStatement = () => {
  const navigate = useNavigate();
  const { state } = useContext(Store);
  const { userInfo } = state;

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedReports, setSelectedReports] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(15);

  // Quick period filter
  const [activePeriod, setActivePeriod] = useState('all');

  // Manual keyword search
  const [searchQuery, setSearchQuery] = useState('');

  // Aggregated totals for the selected period
  const [periodTotals, setPeriodTotals] = useState({ sales: 0, netProfit: 0, depts: 0 });

  const fetchReports = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({ page, limit });
      if (searchQuery) params.append('key', searchQuery);

      const dates = getPeriodDates(activePeriod);
      if (dates) params.append('dateFilter', JSON.stringify(dates));

      const [reportRes, expRes] = await Promise.all([
        axios.get(`/api/report/search?${params}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        }),
        axios.get('/api/expense', {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        })
      ]);

      const data = reportRes.data;
      const allExpenses = expRes.data || [];
      
      // Filter expenses for this period
      const periodExpenses = allExpenses.filter(e => {
        if (!dates) return true;
        const d = new Date(e.createdAt);
        return d >= new Date(dates.startDate) && d <= new Date(dates.endDate);
      });
      const totalPeriodExpenses = periodExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      setReports(data.data);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);

      // Compute period totals: Gross Profit - Expenses = Net Profit
      const totals = data.data.reduce(
        (acc, r) => ({
          sales: acc.sales + (r.sales || 0),
          grossProfit: acc.grossProfit + Number(r.grossProfit || 0),
          depts: acc.depts + (r.depts || 0),
        }),
        { sales: 0, grossProfit: 0, depts: 0 }
      );
      
      setPeriodTotals({
        sales: totals.sales,
        netProfit: totals.grossProfit - totalPeriodExpenses,
        depts: totals.depts
      });
    } catch {
      setError('Failed to fetch reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activePeriod, limit, searchQuery, userInfo]);

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedReports(reports.map(r => r._id));
    } else {
      setSelectedReports([]);
    }
  };

  const toggleSelect = (id) => {
    if (selectedReports.includes(id)) {
      setSelectedReports(selectedReports.filter(x => x !== id));
    } else {
      setSelectedReports([...selectedReports, id]);
    }
  };

  const deleteSelectedHandler = async () => {
    if (window.confirm("Are you sure you want to delete selected reports?")) {
      try {
        setDeleting(true);
        await axios.delete('/api/report', { 
          data: { reportIds: selectedReports }, 
          headers: { Authorization: `Bearer ${userInfo.token}` } 
        });
        toast.success("Reports deleted successfully");
        setSelectedReports([]);
        fetchReports(currentPage);
      } catch (err) {
        toast.error(getError(err));
      } finally {
        setDeleting(false);
      }
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchReports(1);
  }, [activePeriod]);

  useEffect(() => {
    fetchReports(currentPage);
  }, [currentPage]);

  const fmt = (v) => `${(v || 0).toLocaleString()} RWF`;
  const formatDate = (d) =>
    new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <Container className="py-4">
      <Helmet>
        <title>Income Statements - Rightlamps</title>
      </Helmet>

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-gradient mb-0">Financial Ledger</h1>
          <p className="text-muted small fw-bold mb-0 ls-wide">
            {totalCount} record{totalCount !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button
          variant="outline-primary"
          className="rounded-pill"
          onClick={() => navigate('/admin/reportSummary')}
        >
          Performance Analytics
        </Button>
      </div>

      {/* ── Period Toggle ── */}
      <div className="mb-4">
        <div className="d-flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <Button
              key={p.key}
              variant={activePeriod === p.key ? 'primary' : 'outline-secondary'}
              className="rounded-pill fw-bold px-4"
              onClick={() => setActivePeriod(p.key)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Period Summary Cards ── */}
      <Row className="mb-4 g-3">
        <Col xs={12} md={4}>
          <div className="rounded-3 p-3 shadow-sm text-white text-center"
            style={{ background: 'linear-gradient(135deg,#1a73e8,#0d47a1)' }}>
            <div className="small opacity-75 mb-1">Period Revenue</div>
            <div className="fs-4 fw-bold">{fmt(periodTotals.sales)}</div>
          </div>
        </Col>
        <Col xs={12} md={4}>
          <div className="rounded-3 p-3 shadow-sm text-white text-center"
            style={{ background: 'linear-gradient(135deg,#27ae60,#145a32)' }}>
            <div className="small opacity-75 mb-1">Period Net Profit</div>
            <div className="fs-4 fw-bold">{fmt(periodTotals.netProfit)}</div>
          </div>
        </Col>
        <Col xs={12} md={4}>
          <div className="rounded-3 p-3 shadow-sm text-white text-center"
            style={{ background: 'linear-gradient(135deg,#e74c3c,#922b21)' }}>
            <div className="small opacity-75 mb-1">Period Outstanding Debts</div>
            <div className="fs-4 fw-bold">{fmt(periodTotals.depts)}</div>
          </div>
        </Col>
      </Row>

      {/* ── Keyword Search ── */}
      <Card className="border-0 shadow-sm bg-card mb-4 p-3">
        <Row className="align-items-end g-2">
          <Col md={9}>
            <Form.Label className="small fw-bold">Keyword Search</Form.Label>
            <Form.Control
              placeholder="Search by name, payment method, debtor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchReports(1)}
            />
          </Col>
          <Col md={3} className="d-flex gap-2">
            <Button variant="primary" className="flex-grow-1 rounded-pill" onClick={() => fetchReports(1)}>Search</Button>
            <Button variant="light" className="rounded-pill" onClick={() => { setSearchQuery(''); setActivePeriod('all'); }}>Reset</Button>
          </Col>
        </Row>
      </Card>

      {error && <Alert variant="danger" className="border-0 shadow-sm">{error}</Alert>}

      {userInfo && userInfo.isAdmin && selectedReports.length > 0 && (
        <div className="mb-3">
          <Button variant="danger" className="rounded-pill shadow-sm" onClick={deleteSelectedHandler} disabled={deleting}>
            <i className="fas fa-trash-alt me-2"></i> {deleting ? 'Deleting...' : `Delete ${selectedReports.length} Selected Reports`}
          </Button>
        </div>
      )}

      {/* ── Data Table ── */}
      <Card className="border-0 shadow-sm overflow-hidden bg-card mb-4">
        <div className="table-responsive">
          <Table hover className="mb-0 admin-table align-middle">
            <thead className="bg-light">
              <tr className="small text-uppercase ls-wide text-muted">
                {userInfo && userInfo.isAdmin && (
                  <th className="ps-4" style={{ width: '40px' }}>
                    <Form.Check 
                      type="checkbox" 
                      onChange={toggleSelectAll} 
                      checked={reports.length > 0 && selectedReports.length === reports.length}
                    />
                  </th>
                )}
                <th className={userInfo && userInfo.isAdmin ? "" : "ps-4"}>Date</th>
                <th>Name</th>
                <th>Quantity</th>
                <th className="text-end">Costs</th>
                <th className="text-end">Sold/unit</th>
                <th className="text-end">Sales</th>
                <th className="text-end">Gross Profit</th>
                <th className="text-end">Taxes</th>
                <th className="text-end">Net Profit</th>
                <th className="text-end">Depts</th>
                <th className="text-end">Expense</th>
                <th className="text-center">Status</th>
                <th>Comments</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={userInfo && userInfo.isAdmin ? "15" : "14"} className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={userInfo && userInfo.isAdmin ? "15" : "14"} className="text-center py-5 text-muted">No records found for this period.</td></tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id} className={selectedReports.includes(report._id) ? "bg-light" : ""}>
                    {userInfo && userInfo.isAdmin && (
                      <td className="ps-4">
                        <Form.Check 
                          type="checkbox" 
                          checked={selectedReports.includes(report._id)}
                          onChange={() => toggleSelect(report._id)}
                        />
                      </td>
                    )}
                    <td className={`${userInfo && userInfo.isAdmin ? "" : "ps-4"} fw-bold`}>{formatDate(report.createdAt)}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '200px' }}>
                        {report.reportItems.slice(0, 2).map((item, i) => (
                          <Badge key={i} bg="light" text="dark" className="border fw-normal">{item.name}</Badge>
                        ))}
                        {report.reportItems.length > 2 && (
                          <Badge bg="light" text="muted" className="border fw-normal">+{report.reportItems.length - 2} more</Badge>
                        )}
                      </div>
                    </td>
                    <td>{report.real}</td>
                    <td className="text-end">{fmt(report.costs)}</td>
                    <td className="text-end">{fmt(report.soldAt)}</td>
                    <td className="text-end fw-bold">{fmt(report.sales)}</td>
                    <td className="text-end">{fmt(report.grossProfit)}</td>
                    <td className="text-end">{fmt(report.taxPrice)}</td>
                    <td className="text-end">
                      <Badge bg={parseFloat(report.netProfit) >= 0 ? "success" : "danger"} className={`bg-opacity-10 border px-3 ${parseFloat(report.netProfit) >= 0 ? "text-success border-success" : "text-danger border-danger"}`}>
                        {fmt(report.netProfit)}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <span className={report.depts > 0 ? "text-danger small fw-bold" : "text-success small"}>
                        {fmt(report.depts)}
                      </span>
                    </td>
                    <td className="text-end text-danger">{fmt(report.expense)}</td>
                    <td className="text-center">
                      <Badge 
                        bg={
                          report.status === "PAID" ? "success" : 
                          report.status === "HALF-PAID" ? "warning" : "danger"
                        }
                      >
                        {report.comments || report.status || "N/A"}
                      </Badge>
                    </td>
                    <td className="small text-muted">{report.paymentMethod}</td>
                    <td className="text-center">
                      <Button
                        variant="link"
                        className="p-0 text-primary fw-bold text-decoration-none"
                        onClick={() => navigate(`/report/${report._id}`)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* ── Pagination ── */}
      <div className="d-flex justify-content-center">
        {totalPages > 1 && (
          <Pagination className="modern-pagination">
            <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} />
            {[...Array(totalPages).keys()].map(x => (
              <Pagination.Item key={x + 1} active={x + 1 === currentPage} onClick={() => setCurrentPage(x + 1)}>
                {x + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)} />
          </Pagination>
        )}
      </div>
    </Container>
  );
};

export default IncomeStatement;
