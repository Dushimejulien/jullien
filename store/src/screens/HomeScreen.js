import React, { useContext, useEffect, useReducer } from "react";
import axios from "axios";
import { Row, Col, Container, Button } from "react-bootstrap";
import Product from "../components/products";
import { Helmet } from "react-helmet-async";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";
import { Store } from "../Store";
import { useNavigate } from "react-router-dom";
import AdvancedReportModal from "../components/AdvancedReportModal";

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return { ...state, products: action.payload, loading: false };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

function HomeScreen() {
  const [showReportModal, setShowReportModal] = React.useState(false);
  const navigate = useNavigate();
  const [{ loading, error, products }, dispatch] = useReducer(reducer, {
    products: [],
    loading: true,
    error: "",
  });
  const { state } = useContext(Store);
  const { userInfo } = state;

  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: "FETCH_REQUEST" });
      try {
        const result = await axios.get("/api/products");
        dispatch({ type: "FETCH_SUCCESS", payload: result.data });
      } catch (error) {
        dispatch({ type: "FETCH_FAIL", payload: error.message });
      }
    };
    fetchData();
  }, []);

  // Group products by category
  const visibleProducts = Array.isArray(products) 
    ? products.filter(p => p.countInStock > 0 || (userInfo && (userInfo.isAdmin || userInfo.isSeller)))
    : [];

  const categoriesMap = visibleProducts.reduce((acc, product) => {
    const category = product.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {});

  return (
    <Container className="py-4 mt-3">
      <Helmet>
        <title>Rightlamps - Lighting up your world</title>
      </Helmet>

      <div className="d-flex justify-content-between align-items-center mb-5 pb-3 border-bottom">
        <div>
          <h1 className="mb-1 text-gradient fw-bold">Explore Our Collections</h1>
          <p className="text-muted fs-5">Premium lighting solutions for every environment</p>
        </div>
        {!userInfo || (!userInfo.isAdmin && !userInfo.isSeller) ? (
          <Button 
            variant="primary" 
            className="rounded-pill shadow-sm"
            onClick={() => navigate("/special")}
          >
            Request Custom Product
          </Button>
        ) : (
          <div className="d-flex gap-2">
            <Button variant="success" className="rounded-pill shadow-sm px-4" onClick={() => setShowReportModal(true)}>
              <i className="fas fa-plus-circle me-1"></i> Create report
            </Button>
            {userInfo && userInfo.isAdmin && (
              <Button variant="outline-primary" className="rounded-pill shadow-sm" onClick={() => navigate("/admin/products")}>
                Manage Inventory
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Stock Health Panel — visible to Admin & Seller only */}
      {userInfo && (userInfo.isAdmin || userInfo.isSeller) && !loading && Array.isArray(products) && (
        <Row className="mb-4 g-3">
          {/* Total Products */}
          <Col xs={6} md={3}>
            <div className="rounded-3 p-3 text-center shadow-sm" style={{ background: 'linear-gradient(135deg,#1a73e8,#0d47a1)', color: '#fff' }}>
              <div className="fs-1 fw-bold">{products.length}</div>
              <div className="small opacity-75">Total Products</div>
            </div>
          </Col>
          {/* In Stock */}
          <Col xs={6} md={3}>
            <div className="rounded-3 p-3 text-center shadow-sm" style={{ background: 'linear-gradient(135deg,#27ae60,#145a32)', color: '#fff' }}>
              <div className="fs-1 fw-bold">{products.filter(p => p.countInStock >= 10).length}</div>
              <div className="small opacity-75">Healthy Stock (≥10)</div>
            </div>
          </Col>
          {/* Low Stock */}
          <Col xs={6} md={3}>
            <div
              className="rounded-3 p-3 text-center shadow-sm"
              style={{ background: 'linear-gradient(135deg,#f39200,#b36800)', color: '#fff', cursor: 'pointer' }}
              onClick={() => navigate('/search?stock=low')}
            >
              <div className="fs-1 fw-bold">{products.filter(p => p.countInStock > 0 && p.countInStock < 10).length}</div>
              <div className="small opacity-75">⚠ Low Stock (&lt;10)</div>
            </div>
          </Col>
          {/* Out of Stock */}
          <Col xs={6} md={3}>
            <div
              className="rounded-3 p-3 text-center shadow-sm"
              style={{ background: 'linear-gradient(135deg,#e74c3c,#922b21)', color: '#fff', cursor: 'pointer' }}
              onClick={() => navigate('/search?stock=out')}
            >
              <div className="fs-1 fw-bold">{products.filter(p => p.countInStock === 0).length}</div>
              <div className="small opacity-75">🚨 Out of Stock</div>
            </div>
          </Col>
        </Row>
      )}

      {loading ? (
        <LoadingBox />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        Object.keys(categoriesMap).map((category) => (
          <div key={category} className="category-section mb-5">
            <div className="d-flex justify-content-between align-items-center mb-3 px-1">
              <div className="border-start border-primary border-4 ps-3">
                <h3 className="mb-0 fw-bold h4">{category}</h3>
                <div className="text-muted smallest-text">{categoriesMap[category].length} items available</div>
              </div>
              <Button 
                variant="link" 
                className="text-primary fw-bold text-decoration-none p-0 d-flex align-items-center gap-1"
                onClick={() => navigate(`/search?category=${category}`)}
              >
                <span>See All</span>
                <i className="fas fa-chevron-right small"></i>
              </Button>
            </div>
            
            <Row className="g-3 px-1">
              {categoriesMap[category].slice(0, 4).map((product) => (
                <Col key={product._id} xs={6} md={4} lg={3} className="px-2">
                  <Product product={product} />
                </Col>
              ))}
            </Row>
          </div>
        ))
      )}
      {Object.keys(categoriesMap).length === 0 && !loading && (
        <div className="text-center py-5">
           <i className="fas fa-box-open fs-1 text-muted mb-3"></i>
           <h3>No products found</h3>
           <p className="text-muted">Check back later for new arrivals!</p>
        </div>
      )}

      <AdvancedReportModal 
         show={showReportModal} 
         onHide={() => setShowReportModal(false)} 
      />
    </Container>
  );
}

export default HomeScreen;
