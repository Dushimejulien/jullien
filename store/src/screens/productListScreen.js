import React, { useContext, useEffect, useReducer, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";
import { Store } from "../Store";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getError } from "../utils";
import { Row, Col, Button, Form, InputGroup, Container, Table, Badge, Image } from "react-bootstrap";
import Card from "react-bootstrap/Card";
import QuickActionModal from "../components/QuickActionModal";

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return {
        ...state,
        products: action.payload.products,
        page: action.payload.page,
        pages: action.payload.pages,
        loading: false,
      };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "DELETE_REQUEST":
      return { ...state, loadingDelete: true, successDelete: false };
    case "DELETE_SUCCESS":
      return {
        ...state,
        loadingDelete: false,
        successDelete: true,
      };
    case "DELETE_FAIL":
      return { ...state, loadingDelete: false, successDelete: false };

    case "DELETE_RESET":
      return { ...state, loadingDelete: false, successDelete: false };
    default:
      return state;
  }
};

export default function ProductListScreen() {
  const [
    { loading, error, products, pages, loadingDelete, successDelete },
    dispatch,
  ] = useReducer(reducer, {
    loading: true,
    error: "",
  });

  const navigate = useNavigate();
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const page = sp.get("page") || 1;

  const { state } = useContext(Store);
  const { userInfo } = state;

  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [deletingMulti, setDeletingMulti] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`/api/products/admin?page=${page}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });

        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        dispatch({
          type: "FETCH_FAIL",
          payload: getError(err),
        });
      }
    };
    if (successDelete) {
      dispatch({ type: "DELETE_RESET" });
    } else {
      fetchData();
    }
  }, [page, userInfo, successDelete]);

  const deleteHandler = async (product) => {
    if (window.confirm("Are you sure to delete?")) {
      try {
        await axios.delete(`/api/products/${product._id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        toast.success("product deleted successfully");
        dispatch({ type: "DELETE_SUCCESS" });
      } catch (err) {
        toast.error(getError(error));
        dispatch({
          type: "DELETE_FAIL",
        });
      }
    }
  };

  const handleQuickAction = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(products.map(p => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const toggleSelect = (id) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(x => x !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  const deleteSelectedHandler = async () => {
    if (window.confirm("Are you sure you want to delete the selected products?")) {
      try {
        setDeletingMulti(true);
        await axios.delete('/api/products', { 
          data: { productIds: selectedProducts }, 
          headers: { Authorization: `Bearer ${userInfo.token}` } 
        });
        toast.success("Products deleted successfully");
        setSelectedProducts([]);
        dispatch({ type: "DELETE_SUCCESS" });
      } catch (err) {
        toast.error(getError(err));
      } finally {
        setDeletingMulti(false);
      }
    }
  };

  return (
    <Container fluid className="px-4 py-5">
      <Row className="mb-4 align-items-center">
        <Col>
          <h1 className="fw-bold fs-2 text-dark">Management Products</h1>
          <p className="text-muted mb-0">Track inventory and create quick reports</p>
        </Col>
        <Col className="text-end">
          <Button
            type="button"
            variant="primary"
            className="rounded-pill shadow-sm px-4"
            onClick={() => navigate(`/admin/product/create`)}
          >
            <i className="fas fa-plus me-2"></i> Create Product
          </Button>
        </Col>
      </Row>

      {loadingDelete && <LoadingBox></LoadingBox>}

      <QuickActionModal
        show={showModal}
        onHide={() => setShowModal(false)}
        product={selectedProduct}
        onSuccess={() => dispatch({ type: "FETCH_REQUEST" })} // Trigger refresh
      />

      {selectedProducts.length > 0 && (
        <div className="mb-3">
          <Button variant="danger" className="rounded-pill shadow-sm" onClick={deleteSelectedHandler} disabled={deletingMulti}>
            <i className="fas fa-trash-alt me-2"></i> {deletingMulti ? 'Deleting...' : `Delete ${selectedProducts.length} Selected Products`}
          </Button>
        </div>
      )}

      {loading ? (
        <LoadingBox></LoadingBox>
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <>
          <Card className="border-0 shadow-sm overflow-hidden bg-card">
            <Table responsive="md" hover className="mb-0 admin-table align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4" style={{ width: '40px' }}>
                    <Form.Check 
                      type="checkbox" 
                      onChange={toggleSelectAll} 
                      checked={products.length > 0 && selectedProducts.length === products.length}
                    />
                  </th>
                  <th>PRODUCT</th>
                  <th>CATEGORY</th>
                  <th>IN STOCK</th>
                  <th>COST (RWF)</th>
                  <th>PRICE (RWF)</th>
                  <th className="text-end pe-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className={selectedProducts.includes(product._id) ? "bg-light" : ""}>
                    <td className="ps-4">
                      <Form.Check 
                        type="checkbox" 
                        checked={selectedProducts.includes(product._id)}
                        onChange={() => toggleSelect(product._id)}
                      />
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <Image 
                          src={product.image} 
                          rounded 
                          className="me-3 bg-light p-1" 
                          style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                        />
                        <div>
                          <div className="fw-bold">{product.name}</div>
                          <div className="text-muted small">{product.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td><Badge bg="info" className="text-dark bg-opacity-25 px-3">{product.category}</Badge></td>
                    <td>
                      <Badge 
                        bg={product.countInStock < 10 ? "danger" : "light"} 
                        className={`px-3 ${product.countInStock < 10 ? "" : "text-dark"}`}
                      >
                        {product.countInStock}
                      </Badge>
                    </td>
                    <td className="fw-semibold">{product.costPrice ? product.costPrice.toLocaleString() : "0"}</td>
                    <td className="fw-bold text-primary">{product.price ? product.price.toLocaleString() : "0"}</td>
                    <td className="text-end pe-4">
                      <div className="d-flex justify-content-end gap-2">
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="rounded-pill px-3"
                          onClick={() => navigate(`/product/${product.slug}`)}
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          className="rounded-pill px-3"
                          onClick={() => handleQuickAction(product)}
                        >
                          <i className="fas fa-bolt"></i>
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="rounded-pill px-3"
                          onClick={() => navigate(`/admin/product/${product._id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="rounded-pill px-3"
                          onClick={() => deleteHandler(product)}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
          
          {pages > 1 && (
            <div className="mt-4 d-flex justify-content-center gap-2">
              {[...Array(pages).keys()].map((x) => (
                <Button
                  key={x + 1}
                  variant={x + 1 === Number(page) ? "primary" : "outline-secondary"}
                  className="rounded-circle p-0"
                  style={{ width: '36px', height: '36px' }}
                  onClick={() => navigate(`/admin/products?page=${x + 1}`)}
                >
                  {x + 1}
                </Button>
              ))}
            </div>
          )}
        </>
      )}
    </Container>
  );
}
