import axios from "axios"
import { useState } from "react";
import {Button, Col, Container,Form, FormControl, FormGroup, FormLabel, Row} from "react-bootstrap"
import { toast } from "react-toastify";
import photo from "../components/MTN.png"

export default function MomoPay(){
    const [phone, setPhone] = useState('');
    const [paymentNumber, setPaymentNumber] = useState('');
    const [amount,setAmount]=useState('')
    const handlePay=async()=>{
        const tokenURl="https://proxy.momoapi.mtn.co.rw/collection/token/"
        await axios.post(tokenURl,{
            headers:{
                "Content-Type":"application/json",
                'X-Reference-Id':"123456",
                "X-Target-Environment":"mtnrwanda",
                "Ocp-Apim-Subscription-Key":"7e1aa7908e3a48f78351c20a490579ca"
            }
        }).then((res)=>{
            console.log("token",res);
            const token = res.data.token
            console.log(token)
            const paymentUrl="https://www.irembo.com"
            axios.post(paymentUrl,{
                amount:amount,
                currency:"RWF",
                externalId:"1234556",
                payer:{
                    partyIdType:"MSISDN",
                    partyId:`25${phone}`,
                    payeeNote:"You have made your payment"
                },
                payerMessage:"Your payment to RLSG initiated successfully",

            })
        }).catch((err)=>{
            toast.error("Payment failed")
            console.log(err)
        })
    }
    return (
        <Container>
          <Form>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <FormLabel htmlFor="phonenumber">
                    <i className="fa fa-phone"></i> Phone number
                  </FormLabel>
                  <FormControl
                    type="text"
                    id="phonenumber"
                    name="phonenumber"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <Row>
                  <div className="i-con-container">
                    <img src={photo} alt="mtn" />
                  </div>
                  <h3>Pay via mobile money</h3>
                  <Form.Group as={Col} controlId="paymentNumber">
                    <Form.Label>MTN Rwanda</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="078000000"
                      value={paymentNumber}
                      onChange={(e) => setPaymentNumber(e.target.value)}
                    />
                  </Form.Group>
                </Row>
                <Row>
                 
                  <h3>Amount</h3>
                  <Form.Group as={Col} controlId="amount">
                    <Form.Label>Amount</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </Form.Group>
                </Row>
                <Row className="checkout2">
                  <Button
                    type="submit"
                    variant="primary"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePay();
                    }}
                  >
                    Pay
                  </Button>
                </Row>
              </Col>
            </Row>
          </Form>
        </Container>
      );
}