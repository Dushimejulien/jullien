import React, { useState, useEffect, useContext } from 'react';
import {
  Container, Row, Col, Card, Table, Pagination,
  Button, Badge, Modal, Form, Alert, Spinner,
  InputGroup, Accordion
} from 'react-bootstrap';
import axios from 'axios';
import { Store } from '../Store';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const IncomeStatement = () => {
  const navigate = useNavigate();
  const { state } = useContext(Store);
  const { userInfo } = state;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(10);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('text');
  const [yearFilter, setYearFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');

  useEffect(() => {
    fetchReports();
  }, [currentPage]);

  const fetchReports = async (searchParams = {}) => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit,
        ...searchParams
      });
      
      if (yearFilter) params.append('year', yearFilter);
      if (monthFilter) params.append('month', monthFilter);
      if (dayFilter) params.append('day', dayFilter);
      
      const { data } = await axios.get(`/api/report/search?${params}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });

      setReports(data.data);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (err) {
      setError('Failed to fetch reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    const searchParams = searchType === 'text' && searchQuery ? { key: searchQuery } : {};
    fetchReports(searchParams);
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setYearFilter('');
    setMonthFilter('');
    setDayFilter('');
    setCurrentPage(1);
    fetchReports();
  };

  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString() + ' RWF';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Container className="py-4">
      <Helmet>
        <title>Income Statements - Rightlamps</title>
      </Helmet>
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="text-gradient">Financial Ledger</h1>
          <p className="text-muted small ls-wide uppercase fw-bold">Audit History ({totalCount} Records)</p>
        </div>
        <Button variant="outline-primary" className="rounded-pill" onClick={() => navigate('/admin/reportSummary')}>
          Performance Analytics
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-card mb-4 overflow-hidden">
        <Accordion flush>
          <Accordion.Item eventKey="0" className="bg-transparent">
            <Accordion.Header className="px-3">
              <i className="fas fa-filter me-2 text-primary"></i> Advanced Search & Filtering
            </Accordion.Header>
            <Accordion.Body className="bg-light bg-opacity-10 p-4">
              <Row className="gy-3 align-items-end">
                <Col md={3}>
                  <Form.Label className="small fw-bold">Search Type</Form.Label>
                  <Form.Select className="border-0 bg-white" value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                    <option value="text">Keyword Search</option>
                    <option value="date">Date Targeting</option>
                  </Form.Select>
                </Col>
                {searchType === 'text' ? (
                  <Col md={6}>
                    <Form.Label className="small fw-bold">Keyword</Form.Label>
                    <Form.Control
                      placeholder="Search items, remarks, methods..."
                      className="border-0 bg-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </Col>
                ) : (
                  <Col md={6}>
                     <Form.Label className="small fw-bold">Target Period (YYYY/MM/DD)</Form.Label>
                     <Row className="g-2">
                        <Col><Form.Control type="number" placeholder="Year" className="border-0 bg-white" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} /></Col>
                        <Col><Form.Control type="number" placeholder="Month" className="border-0 bg-white" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} /></Col>
                        <Col><Form.Control type="number" placeholder="Day" className="border-0 bg-white" value={dayFilter} onChange={(e) => setDayFilter(e.target.value)} /></Col>
                     </Row>
                  </Col>
                )}
                <Col md={3} className="d-flex gap-2">
                  <Button variant="primary" className="flex-grow-1 rounded-pill fw-bold" onClick={handleSearch}>Apply</Button>
                  <Button variant="light" className="rounded-pill" onClick={handleResetSearch}>Reset</Button>
                </Col>
              </Row>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Card>

      {error && <Alert variant="danger" className="border-0 shadow-sm">{error}</Alert>}

      <Card className="border-0 shadow-sm overflow-hidden bg-card mb-4">
        <div className="table-responsive">
          <Table hover className="mb-0 admin-table align-middle">
            <thead className="bg-light">
              <tr className="small text-uppercase ls-wide text-muted">
                <th className="ps-4">Date</th>
                <th>Reconciled Items</th>
                <th className="text-end">Revenue</th>
                <th className="text-end">Net Profit</th>
                <th className="text-end">Debt Status</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-5 text-muted">No audit trails found matching your criteria.</td></tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id}>
                    <td className="ps-4">
                       <div className="fw-bold">{formatDate(report.createdAt)}</div>
                       <div className="small text-muted">{report.paymentMethod}</div>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '300px' }}>
                        {report.reportItems.slice(0, 3).map((item, i) => (
                          <Badge key={i} bg="light" text="dark" className="border fw-normal">{item.name}</Badge>
                        ))}
                        {report.reportItems.length > 3 && <Badge bg="light" text="muted" className="border fw-normal">+{report.reportItems.length-3} more</Badge>}
                      </div>
                    </td>
                    <td className="text-end fw-bold">{formatCurrency(report.sales)}</td>
                    <td className="text-end"><Badge bg="success" className="bg-opacity-10 text-success border border-success px-3">{formatCurrency(report.netProfit)}</Badge></td>
                    <td className="text-end">
                       {report.depts > 0 ? (
                         <span className="text-danger small fw-bold"><i className="fas fa-exclamation-circle me-1"></i>{formatCurrency(report.depts)}</span>
                       ) : (
                         <span className="text-success small"><i className="fas fa-check-circle me-1"></i>Cleared</span>
                       )}
                    </td>
                    <td className="text-center">
                      <Button variant="link" className="p-0 text-primary fw-bold text-decoration-none" onClick={() => navigate(`/report/${report._id}`)}>
                        Audit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      <div className="d-flex justify-content-center">
        {totalPages > 1 && (
          <Pagination className="modern-pagination">
            <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} />
            {[...Array(totalPages).keys()].map(x => (
              <Pagination.Item key={x+1} active={x+1 === currentPage} onClick={() => setCurrentPage(x+1)}>
                {x+1}
              </Pagination.Item>
            ))}
            <Pagination.Next disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} />
          </Pagination>
        )}
      </div>
    </Container>
  );
};

export default IncomeStatement;
