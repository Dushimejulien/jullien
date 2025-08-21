import React, { useState, useEffect, useContext } from 'react';
import {
  Container, Row, Col, Card, Table, Pagination,
  Button, Badge, Modal, Form, Alert, Spinner,
  InputGroup, Dropdown, FormControl, Accordion
} from 'react-bootstrap';
import axios from 'axios';
import { Store } from '../Store';
import { useNavigate } from 'react-router-dom';

const ReportsList = () => {
  const navigate = useNavigate()
  const { state,  } = useContext(Store);
  const {userInfo}=state
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedReports, setSelectedReports] = useState(new Set());
  const [allSelectedOnPage, setAllSelectedOnPage] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('text');
  const [yearFilter, setYearFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [deptsFilter, setDeptsFilter] = useState('all');
  const [searchLoading, setSearchLoading] = useState(false);

  // Load selected reports from localStorage on component mount
  useEffect(() => {
    const savedSelections = localStorage.getItem('selectedReports');
    if (savedSelections) {
      try {
        setSelectedReports(new Set(JSON.parse(savedSelections)));
      } catch (e) {
        console.error('Error loading selections from localStorage:', e);
      }
    }
  }, []);

  // // Save selected reports to localStorage whenever they change
  // useEffect(() => {
  //   localStorage.setItem('selectedReports', JSON.stringify(Array.from(selectedReports)));
  // }, [selectedReports]);

  useEffect(() => {
    fetchReports();
  }, [currentPage]);

  useEffect(() => {
    // Apply sorting to filtered reports
    const sorted = [...filteredReports].sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
    });
    
    setFilteredReports(sorted);
    
    // Check if all reports on current page are selected
    const currentPageReportIds = sorted.map(report => report._id);
    const allSelected = currentPageReportIds.length > 0 && 
                        currentPageReportIds.every(id => selectedReports.has(id));
    setAllSelectedOnPage(allSelected);
  }, [sortOrder, selectedReports]);

  const fetchReports = async (searchParams = {}) => {
    try {
      setLoading(true);
      setError('');
      
      const token = userInfo.token
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit,
        ...searchParams
      });
      
      // Add date filters if provided
      if (yearFilter) params.append('year', yearFilter);
      if (monthFilter) params.append('month', monthFilter);
      if (dayFilter) params.append('day', dayFilter);
      
      if (deptsFilter !== 'all') {
        params.append('depts', deptsFilter === 'withDepts');
      }
      
      const response = await axios.get(`/api/report/search?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setReports(response.data.data);
      setFilteredReports(response.data.data);
      setTotalPages(response.data.totalPages);
      setTotalCount(response.data.totalCount);
    } catch (err) {
      setError('Failed to fetch reports. Please try again.');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchLoading(true);
    setCurrentPage(1);
    
    if (searchType === 'text' && searchQuery) {
      fetchReports({ key: searchQuery });
    } else if (searchType === 'date' && (yearFilter || monthFilter || dayFilter)) {
      fetchReports();
    } else {
      // If no search criteria, fetch all reports
      fetchReports();
    }
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setYearFilter('');
    setMonthFilter('');
    setDayFilter('');
    setDeptsFilter('all');
    setCurrentPage(1);
    fetchReports();
  };

  const handleDeleteClick = (report) => {
    setSelectedReport(report);
    setShowDeleteModal(true);
    setDeleteError('');
    setSuccessMessage('');
  };

  const handleBulkDeleteClick = () => {
    if (selectedReports.size === 0) {
      setDeleteError('Please select at least one report to delete.');
      return;
    }
    setShowDeleteModal(true);
    setDeleteError('');
    setSuccessMessage('');
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      setDeleteError('');
      
      const token = userInfo.token
      
      if (selectedReport) {
        // Single delete
        await axios.delete(`/api/report/${selectedReport._id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Remove from selections if it was selected
        const newSelections = new Set(selectedReports);
        newSelections.delete(selectedReport._id);
        setSelectedReports(newSelections);
        
        setSuccessMessage('Report deleted successfully!');
      } else if (selectedReports.size > 0) {
        // Bulk delete
        setBulkDeleteLoading(true);
        const deletePromises = Array.from(selectedReports).map(id => 
          axios.delete(`/api/report/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        );
        
        await Promise.all(deletePromises);
        setSelectedReports(new Set());
        setSuccessMessage(`${selectedReports.size} report(s) deleted successfully!`);
      }
      
      setShowDeleteModal(false);
      fetchReports(); // Refresh the list
    } catch (err) {
      setDeleteError('Failed to delete report(s). Please try again.');
      console.error('Error deleting report(s):', err);
    } finally {
      setDeleteLoading(false);
      setBulkDeleteLoading(false);
    }
  };

  const toggleReportSelection = (reportId) => {
    const newSelections = new Set(selectedReports);
    if (newSelections.has(reportId)) {
      newSelections.delete(reportId);
    } else {
      newSelections.add(reportId);
    }
    setSelectedReports(newSelections);
  };

  const toggleSelectAll = () => {
    const currentPageReportIds = filteredReports.map(report => report._id);
    
    if (allSelectedOnPage) {
      // Deselect all on current page
      const newSelections = new Set(selectedReports);
      currentPageReportIds.forEach(id => newSelections.delete(id));
      setSelectedReports(newSelections);
    } else {
      // Select all on current page
      const newSelections = new Set(selectedReports);
      currentPageReportIds.forEach(id => newSelections.add(id));
      setSelectedReports(newSelections);
    }
  };

  const handleSortChange = (order) => {
    setSortOrder(order);
  };

  const handleSearchTypeChange = (type) => {
    setSearchType(type);
    setSearchQuery('');
    setYearFilter('');
    setMonthFilter('');
    setDayFilter('');
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RWF'
    }).format(amount || 0);
  };

  // Generate year options (from 2020 to current year)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2020; year <= currentYear; year++) {
      years.push(year);
    }
    return years.reverse(); // Show most recent years first
  };

  // Generate month options
  const generateMonthOptions = () => {
    return [
      { value: '1', label: 'January' },
      { value: '2', label: 'February' },
      { value: '3', label: 'March' },
      { value: '4', label: 'April' },
      { value: '5', label: 'May' },
      { value: '6', label: 'June' },
      { value: '7', label: 'July' },
      { value: '8', label: 'August' },
      { value: '9', label: 'September' },
      { value: '10', label: 'October' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' }
    ];
  };

  // Generate day options (1-31)
  const generateDayOptions = () => {
    const days = [];
    for (let day = 1; day <= 31; day++) {
      days.push(day);
    }
    return days;
  };

  const renderPaginationItems = () => {
    let items = [];
    
    // Previous button
    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      />
    );

    // Page numbers - show up to 5 pages around current page
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 28);
    
    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    // Next button
    items.push(
      <Pagination.Next
        key="next"
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      />
    );

    return items;
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading reports...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className="mb-0">Sales Reports</h3>
                <small className="text-muted">
                  Displaying {filteredReports.length} of {totalCount} reports
                  {sortOrder === 'newest' ? ' (newest first)' : ' (oldest first)'}
                </small>
              </div>
              <div className="d-flex align-items-center">
                <Badge bg="secondary" className="me-3">
                  {filteredReports.length} reports on this page
                </Badge>
                {selectedReports.size > 0 && (
                  <Badge bg="primary">
                    {selectedReports.size} selected
                  </Badge>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              <Accordion defaultActiveKey="0" className="mb-4">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Search & Filter Options</Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <Col md={12} className="mb-3">
                        <Form.Check
                          inline
                          type="radio"
                          label="Text Search"
                          name="searchType"
                          checked={searchType === 'text'}
                          onChange={() => handleSearchTypeChange('text')}
                        />
                        <Form.Check
                          inline
                          type="radio"
                          label="Date Search"
                          name="searchType"
                          checked={searchType === 'date'}
                          onChange={() => handleSearchTypeChange('date')}
                        />
                      </Col>
                      
                      {searchType === 'text' ? (
                        <Col md={8}>
                          <InputGroup>
                            <InputGroup.Text>
                              <i className="fas fa-search"></i>
                            </InputGroup.Text>
                            <FormControl
                              placeholder="Search by payment method, status, comments..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                          </InputGroup>
                        </Col>
                      ) : (
                        <Col md={8}>
                          <Row>
                            <Col md={4}>
                              <Form.Label>Year</Form.Label>
                              <Form.Select
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                              >
                                <option value="">Select Year</option>
                                {generateYearOptions().map(year => (
                                  <option key={year} value={year}>{year}</option>
                                ))}
                              </Form.Select>
                            </Col>
                            <Col md={4}>
                              <Form.Label>Month</Form.Label>
                              <Form.Select
                                value={monthFilter}
                                onChange={(e) => setMonthFilter(e.target.value)}
                                disabled={!yearFilter}
                              >
                                <option value="">Select Month</option>
                                {generateMonthOptions().map(month => (
                                  <option key={month.value} value={month.value}>{month.label}</option>
                                ))}
                              </Form.Select>
                            </Col>
                            <Col md={4}>
                              <Form.Label>Day</Form.Label>
                              <Form.Select
                                value={dayFilter}
                                onChange={(e) => setDayFilter(e.target.value)}
                                disabled={!yearFilter || !monthFilter}
                              >
                                <option value="">Select Day</option>
                                {generateDayOptions().map(day => (
                                  <option key={day} value={day}>{day}</option>
                                ))}
                              </Form.Select>
                            </Col>
                          </Row>
                        </Col>
                      )}
                      
                      <Col md={2}>
                        <Form.Label>Depts Filter</Form.Label>
                        <Form.Select
                          value={deptsFilter}
                          onChange={(e) => setDeptsFilter(e.target.value)}
                        >
                          <option value="all">All Reports</option>
                          <option value="withDepts">With Depts</option>
                          <option value="withoutDepts">Without Depts</option>
                        </Form.Select>
                      </Col>
                      
                      <Col md={2} className="d-flex align-items-end">
                        <Button 
                          variant="primary" 
                          onClick={handleSearch}
                          disabled={searchLoading}
                          className="me-2"
                        >
                          {searchLoading ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            'Search'
                          )}
                        </Button>
                        <Button variant="outline-secondary" onClick={handleResetSearch}>
                          Reset
                        </Button>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>

              <Row className="mb-3">
                <Col md={6}>
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary">
                      <i className="fas fa-sort me-1"></i>
                      Sort: {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item 
                        active={sortOrder === 'newest'}
                        onClick={() => handleSortChange('newest')}
                      >
                        Newest First
                      </Dropdown.Item>
                      <Dropdown.Item 
                        active={sortOrder === 'oldest'}
                        onClick={() => handleSortChange('oldest')}
                      >
                        Oldest First
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Col>
              </Row>

              {error && <Alert variant="danger">{error}</Alert>}
              {successMessage && <Alert variant="success">{successMessage}</Alert>}
              
              {filteredReports.length === 0 ? (
                <Alert variant="info" className="text-center">
                  {searchQuery || yearFilter || monthFilter || dayFilter || deptsFilter !== 'all' 
                    ? 'No reports match your search criteria.' 
                    : 'No reports found.'}
                </Alert>
              ) : (
                <>
                  <div className="d-flex justify-content-between mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Select all on this page"
                      checked={allSelectedOnPage}
                      onChange={toggleSelectAll}
                    />
                    {selectedReports.size > 0 && (
                      <Button
                        variant="outline-danger"
                        onClick={handleBulkDeleteClick}
                        disabled={bulkDeleteLoading}
                      >
                        {bulkDeleteLoading ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-1"
                            />
                            Deleting...
                          </>
                        ) : (
                          `Delete Selected (${selectedReports.size})`
                        )}
                      </Button>
                    )}
                  </div>
                  
                  <div className="table-responsive">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}></th>
                        
                <th>Date</th>
                <th>Name</th>
                <th>Quantity</th>
                <th>Sold at</th>
                <th>sales</th>
                <th>costs</th>
                <th>taxes</th>
                <th>Gross profit</th>
                <th>Net profit</th>
                <th>Depts</th>
                <th>Expense</th>
                <th>Status</th>
                {/* <td>Status</td> */}
                <td>comments</td>
                <td>Action</td>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReports.map((report, index) => (
                          <tr key={report._id} className={selectedReports.has(report._id) ? 'table-active' : ''}>
                            <td>
                              <Form.Check
                                type="checkbox"
                                checked={selectedReports.has(report._id)}
                                onChange={() => toggleReportSelection(report._id)}
                              />
                            </td>
                            <td>{formatDate(report.createdAt)}</td>
                            <td>
                              <div>
                                {report.reportItems.slice(0, 2).map((item, i) => (
                                  <div key={i} className="d-flex align-items-center mb-1">
                                   
                                    <span>{item.name} (x{item.quantity})</span>
                                    <span>{item.quantity}</span>
                                  </div>
                                ))}
                                {report.reportItems.length > 2 && (
                                  <Badge bg="light" text="dark">
                                    +{report.reportItems.length - 2} more items
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td>{report.inStock}</td>
                            <td>{formatCurrency(report.soldAt)}</td>
                            <td>{formatCurrency(report.sales)}</td>
                            <td>{formatCurrency(report.costs)}</td>
                            <td>{formatCurrency(report.taxPrice)}</td>
                            <td>{formatCurrency(report.grossProfit)}</td>
                            <td>
                              <Badge bg={parseFloat(report.netProfit) >= 0 ? "success" : "danger"}>
                                {formatCurrency(report.netProfit)}
                              </Badge>
                            </td>
                            <td style={{ color: 'tomato' }}>{formatCurrency(report.depts)}</td>
                            <td style={{ color: 'tomato' }}>
                              
                                {formatCurrency(report.expense)}

                            </td>
                            <td>
                              <Badge 
                                bg={
                                  report.status === "PAID" ? "success" : 
                                  report.status === "HALF-PAID" ? "warning" : "danger"
                                }
                              >
                                {report.comments}
                              </Badge>
                            </td>
                            <td>{report.paymentMethod}</td>
                            
                            <td>
                              <Button
                      type="button"
                      variant="info"
                      onClick={() => {
                        navigate(`/report/${report._id}`);
                      }}
                    >
                      Details
                    </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <Pagination>
                        {renderPaginationItems()}
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedReport ? 'Confirm Delete' : `Delete ${selectedReports.size} Report(s)`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteError && <Alert variant="danger">{deleteError}</Alert>}
          {selectedReport ? (
            <p>Are you sure you want to delete this report from {formatDate(selectedReport.createdAt)}?</p>
          ) : (
            <p>Are you sure you want to delete {selectedReports.size} selected report(s)?</p>
          )}
          <p className="text-muted">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteConfirm}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-1"
                />
                Deleting...
              </>
            ) : (
              selectedReport ? 'Delete Report' : `Delete ${selectedReports.size} Report(s)`
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ReportsList;
