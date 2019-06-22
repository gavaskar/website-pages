import React from "react";
import PropTypes from "prop-types";
import toHTMLText from "html-react-parser";
import pretty from "pretty";
import { Grid, Segment, Icon, Header, Tab, Label, Button, Message, Menu, Modal, TextArea, Form } from "semantic-ui-react";
import Page from "./page/Page";

export default class SingleDocView extends React.Component {
    static propTypes = {
        lpdId: PropTypes.number.isRequired,
        onClose: PropTypes.func,
        onValidationCompletion: PropTypes.func
    }

    constructor(args) {
        super(args);
        this.state = {
            data: {
                id: undefined,
                namespace: undefined,
                doc: {
                    id: undefined,
                    namespace: undefined,
                    title: "",
                    oldPrimaryContent: "",
                    oldSecondaryContent: "",
                    newPrimaryContent: {},
                },
                conversionStatus: undefined,
                conversionErrorCode: undefined,
                conversionErrorMessage: undefined,
                conversionErrorPayload: undefined,
                validationComments: ""
            }
        };
    }
    
    render() {
        const segments = [
            {
                title: "Primary Content Rendering",
                left: <div className="wc-preview"><div className="primary-txt article-txt">{toHTMLText(this.state.data.doc.oldPrimaryContent || "")}</div></div>,
                right: <div className="wc-preview"><div className="primary-txt article-txt"><Page doc={this.state.data.doc.newPrimaryContent || {}}/></div></div>
            },
            {
                title: "Primary Content Source",
                left: <pre><code>{pretty(this.state.data.doc.oldPrimaryContent || "", {ocd: true})}</code></pre>,
                right: <pre><code>{JSON.stringify(this.state.data.doc.newPrimaryContent || {}, null, 4)}</code></pre>
            }
        ];

        const actions = (
            <Button.Group size="mini">
                <Button color="green" onClick={() => this.props.onValidationCompletion("PERFECT")}>Picture Perfect</Button>
                <Button.Or/>
                <Modal trigger={<Button color="orange">Acceptable</Button>}
                    header='JUST Acceptable!!! What could be better?'
                    content={createCommentsForm(this)}
                    actions={["Close", { key: "done", content: "Done", positive: true, onClick: this.handleAcceptableConfirmation}]}/>
                <Button.Or/>
                <Modal trigger={<Button color="red">Not Acceptable</Button>}
                    header='NOT Acceptable!!! Sorry. What is wrong?'
                    content={createCommentsForm(this)}
                    actions={["Close", { key: "done", content: "Done", positive: true, onClick: this.handleNotAcceptableConfirmation}]}/>
                <Button.Or/>
                <Button onClick={this.props.onClose}>Go Back</Button>
            </Button.Group>
        );

        return (
            <Grid padded>
                <Grid.Row>
                    <Grid.Column width={11}>
                        <Header as="h2">
                            <Icon name="docker"/>
                            Verifying migration of LandingPage - {this.state.data.doc.title}
                        </Header>
                    </Grid.Column>
                    <Grid.Column width={5}>
                        <Label.Group tag color='teal' floated="right">
                            <Label>ID<Label.Detail>{this.state.data.doc.id}</Label.Detail></Label>
                            <Label>Namespace<Label.Detail>{this.state.data.doc.namespace}</Label.Detail></Label>
                            <Label as="a" href={`https://www.bankbazaar.com/${this.state.data.doc.namespace}.html`} target="_blank">Live Preview</Label>
                        </Label.Group>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row columns={1}>
                    {this.state.data.conversionErrorMessage &&
                        <Message error header={`Conversion Error: ${this.state.data.conversionErrorCode}`} content={this.state.data.conversionErrorMessage}/>
                    }
                </Grid.Row>
                <Grid.Row columns={1}>
                    <Grid.Column>
                        {renderAsTabs(segments, actions, this)}
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        );
    }

    componentDidMount() {
        fetch("/api/lpd/" + this.props.lpdId, {headers: {"Content-Type": "application/json"}})
            .then((response) => response.json())
            .then((response) => {
                this.setState({data: response});
            });
    }

    handleAcceptableConfirmation = (e, data) => {
        if (!this.props.onValidationCompletion) {
            return;
        }

        this.props.onValidationCompletion("ACCEPTABLE", this.state.validationComments);
    }

    handleNotAcceptableConfirmation = (e, data) => {
        if (!this.props.onValidationCompletion) {
            return;
        }

        this.props.onValidationCompletion("NOT_ACCEPTABLE", this.state.validationComments);
    }
}

const renderAsTabs = (segments, actions, self) => {
    const panes = segments.map((s) => ({
        menuItem: s.title, 
        render: () => <Tab.Pane>{createDiffingGrid(s.left, s.right)}</Tab.Pane>}
    ));
    panes.push({
        menuItem: (
            <Menu.Item key='actions' disabled>
                <Label pointing="right" color="teal">Actions:</Label>
                {actions}
            </Menu.Item>
        )
    });
    return <Tab panes={panes} menu={{ secondary: true, pointing: true }}/>;
};

const createDiffingGrid = (left, right, color="red") => {
    return (
        <Grid columns={2} padded style={{height: 600, overflowY: "scroll"}}>
            <Grid.Column>
                <Header as="h3" attached="top" color={color}>Old</Header>
                <Segment color={color} attached>{left}</Segment>
            </Grid.Column>
            <Grid.Column>
                <Header as="h3" attached="top" color={color}>New</Header>
                <Segment color={color} attached>{right}</Segment>
            </Grid.Column>
        </Grid>        
    );
};

const createCommentsForm = (view) => {
    return (
        <Form style={{padding: 10}}>
            <Form.Field>
                <label>Comments:</label>
                <Form.TextArea name="comments" placeholder="Give your comments" onChange={(e, {name, value}) => view.setState({validationComments: value})}/>
            </Form.Field>
        </Form>
    );
}