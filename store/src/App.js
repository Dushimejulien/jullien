import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import { LinkContainer } from 'react-router-bootstrap';
import Nav from 'react-bootstrap/Nav';
import Badge from 'react-bootstrap/Badge';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { Store } from './Store.js';
import HomeScreen from './screens/HomeScreen.js';
import ProductScreen from './screens/ProductScreen.js';
import { Link } from 'react-router-dom';
import CartScreen from './screens/CartScreen.js';
import ShippingAddress from './screens/ShippingAddress';
import SignupScreen from './screens/SignupScreen';
import PaymentMethods from './screens/PaymentMethods';
import PlaceOrderScreen from './screens/PlaceOrderScreen';
import OrderScreen from './screens/OrderScreen';
import OrderHistory from './screens/OrderHistory';
import ProfileScreen from './screens/ProfileScreen';
import Button from 'react-bootstrap/Button';
import { getError } from './utils';
import axios from 'axios';
import SearchBox from './components/SearchBox';
import SearchScreen from './screens/SearchScreen';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardScreen from './screens/DashboardScreen';

import ProductEditScreen from './screens/ProductEditScreen';
import OrderListScreen from './screens/OrderListScreen';
import UserListScreen from './screens/UserListScreen';
import UserEditScreen from './screens/UserEditScreen';
import Report from './screens/IncomeStatment';
import SendReport from './screens/SendReport';
import ReportScreen from './screens/ReportScreen';
import ReportDashboard from './screens/ReportDashboard';
import Iyandikishe from './screens/Irandikishe';
import Kora from './screens/Kora';
import Expense from './screens/Expese';
import SeeReport from './screens/SeeReport';
import Special from './screens/Special';
import GetSpecial from './screens/GetSpecial';
import SearchForm from './screens/SearchDept';
import MyShop from './screens/MyShop';
import ExpensesByMonth from './screens/MonthyExpense';
import MomoPay from './screens/PayScreen.js';

function App() {
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { cart, userInfo } = state;
 
  const signoutHandler = () => {
    ctxDispatch({ type: 'USER_SIGNOUT' });
    localStorage.removeItem('userInfo');
    localStorage.removeItem('shippingAddress');
    localStorage.removeItem('paymentMethod');
    window.location.href = '/signin';
  };
  const [sidebarIsOpen, setSidebarIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  //we committed this

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get(`/api/products/categories`);
        setCategories(data);
      } catch (err) {
        toast.error(getError(err));
      }
    };
    fetchCategories();
  }, []);

  return (
    <BrowserRouter>
      <div
        className={
          sidebarIsOpen
            ? 'd-flex flex-column site-container active-cont'
            : 'd-flex flex-column site-container'
        }
      >
        <ToastContainer position="bottom-center" limit={1} />
        <header>
          <Navbar
            style={{ backgroundColor: 'Green' }}
            variant="dark"
            expand="lg"
          >
            <Container>
              <Button
                variant="dark"
                onClick={() => setSidebarIsOpen(!sidebarIsOpen)}
              >
                <i className="fas fa-bars"></i>
              </Button>
              <LinkContainer to="/">
                <Navbar.Brand>
                  <img
                    src="/logo.png"
                    width={40}
                    height={40}
                    style={{ borderRadius: '50%' }}
                    alt="logo"
                  />
                </Navbar.Brand>
              </LinkContainer>
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                <SearchBox />
                <Nav className="me-auto w-100 justify-content-end ">
                  <Link to="/cart" className="nav-link">
                    cart
                    {cart.cartItems.length > 0 && (
                      <Badge pill bg="danger">
                        {cart.cartItems.length}
                        {cart.cartItems.reduce((a, c) => a + c.quantity, 0)}
                      </Badge>
                    )}
                  </Link>
                  {userInfo ? (
                    <NavDropdown title={userInfo.name} id="basic-nav-dropdown">
                      <LinkContainer to="/profile">
                        <NavDropdown.Item>User Profile</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/orderhistory">
                        <NavDropdown.Item>Order History</NavDropdown.Item>
                      </LinkContainer>
                      <NavDropdown.Divider />
                      <Link
                        className="dropdown-item"
                        to="#signout"
                        onClick={signoutHandler}
                      >
                        Sign Out
                      </Link>
                    </NavDropdown>
                  ) : (
                    <Link className="nav-link" to="/signin">
                      Sign In
                    </Link>
                  )}
                  {userInfo && userInfo.isAdmin && (
                    <NavDropdown title="Admin" id="admin-nav-dropdown">
                      <LinkContainer to="/admin/dashboard">
                        <NavDropdown.Item>Dashboard</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/reportSummary">
                        <NavDropdown.Item>Report dashboard</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/special">
                        <NavDropdown.Item>Komande</NavDropdown.Item>
                      </LinkContainer>

                      <LinkContainer to="/admin/report">
                        <NavDropdown.Item>report</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/expenses">
                        <NavDropdown.Item>expense</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/myshop">
                        <NavDropdown.Item>shop</NavDropdown.Item>
                      </LinkContainer>

                      <LinkContainer to="/admin/orders">
                        <NavDropdown.Item>orders</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/monthly">
                        <NavDropdown.Item>Montly expenses</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/users">
                        <NavDropdown.Item>users</NavDropdown.Item>
                      </LinkContainer>
                    </NavDropdown>
                  )}
                  {userInfo && userInfo.isSeller && (
                    <NavDropdown title="Seller" id="seller-nav-dropdown">
                      <LinkContainer to="/admin/report">
                        <NavDropdown.Item>report</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/expenses">
                        <NavDropdown.Item>expense</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/special">
                        <NavDropdown.Item>Komande</NavDropdown.Item>
                      </LinkContainer>

                      <LinkContainer to="/admin/orders">
                        <NavDropdown.Item>orders</NavDropdown.Item>
                      </LinkContainer>
                    </NavDropdown>
                  )}
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>
        </header>

        <div
          className={
            sidebarIsOpen
              ? 'active-nav side-navbar d-flex justify-content-between flex-wrap flex-column'
              : 'side-navbar d-flex justify-content-between flex-wrap flex-column'
          }
        >
          <Nav className="flex-column text-white w-100 p-2">
            <Nav.Item>
              <strong>Categories</strong>
            </Nav.Item>
            {categories.map((category) => (
              <Nav.Item key={category}>
                <LinkContainer
                  to={`/search?category=${category}`}
                  onClick={() => setSidebarIsOpen(false)}
                >
                  <Nav.Link>{category}</Nav.Link>
                </LinkContainer>
              </Nav.Item>
            ))}
          </Nav>
        </div>
        <main>
          <Container>
            <Routes>
              <Route path="/product/:slug" element={<ProductScreen />} />
              <Route path="/cart" element={<CartScreen />} />
              <Route path="/signin" element={<Iyandikishe />} />
              <Route path="/signup" element={<SignupScreen />} />
              <Route path="/special" element={<Special />} />
              <Route path="/reportReview" element={<SendReport />} />
              <Route path="/search" element={<SearchScreen />} />
              <Route path="/depts" element={<SearchForm />} />
              <Route path="/pay" element={<MomoPay/>} />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfileScreen />
                  </ProtectedRoute>
                }
              />
              <Route path="/placeorder" element={<PlaceOrderScreen />} />
              <Route
                path="/order/:id"
                element={
                  <ProtectedRoute>
                    <OrderScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report/:id"
                element={
                  <ProtectedRoute>
                    <ReportScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/update/:id"
                element={
                  <ProtectedRoute>
                    <ReportScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orderHistory"
                element={
                  <ProtectedRoute>
                    <OrderHistory />
                  </ProtectedRoute>
                }
              />
             
              <Route path="/shipping" element={<ShippingAddress />} />
              <Route path="/payment" element={<PaymentMethods />} />
              {/*Admin Routes*/}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reportSummary"
                element={
                  <ProtectedRoute>
                    <ReportDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/special"
                element={
                  <ProtectedRoute>
                    <GetSpecial />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/createReport"
                element={
                  <ProtectedRoute>
                    <Kora />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute>
                    <UserListScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/expenses"
                element={
                  <ProtectedRoute>
                    <SeeReport />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/report"
                element={
                  <ProtectedRoute>
                    <Report />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/create"
                element={
                  <ProtectedRoute>
                    <Expense />
                  </ProtectedRoute>
                }
              />
               <Route
                path="/admin/myshop"
                element={
                  <ProtectedRoute>
                    <MyShop/>
                  </ProtectedRoute>
                }
              />
               <Route
                path="/admin/monthly"
                element={
                  <ProtectedRoute>
                    <ExpensesByMonth/>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/user/:id"
                element={
                  <ProtectedRoute>
                    <UserEditScreen />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/product/:id"
                element={
                  <ProtectedRoute>
                    <ProductEditScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <ProtectedRoute>
                    <OrderListScreen />
                  </ProtectedRoute>
                }
              />

              <Route path="/" element={<HomeScreen />} />
            </Routes>
          </Container>
        </main>
        <footer>
          <div className="text-center">all right reserved</div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
