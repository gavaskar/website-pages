import React from "react";
import { Table, Button, Pagination } from "semantic-ui-react";
import PropTypes from "prop-types";
import DetailedSingleDocView from "./DetailedSingleDocView";

export default class ListingView extends React.Component {
    static propTypes = {
        startingOffset: PropTypes.number
    }

    state = {
        docs: [],
        docId: undefined,
    }

    render() {
        if (this.state.docId) {
            return this.renderSingleDocument();
        } else {
            return this.renderDocumentsListing();
        }
    }

    componentDidMount() {
        this.fetchRows(this.props.startingOffset || 0);
    }

    renderSingleDocument() {
        return <DetailedSingleDocView lpdId={this.state.docId} onValidationCompletion={this.handleValidationResult} onClose={() => this.setState({docId: undefined})}/>;
    }

    renderDocumentsListing() {
        const paginator = <Pagination onPageChange={this.changeActivePage} defaultActivePage={1} totalPages={200} firstItem={null} lastItem={null} boundary={1} siblingRange={3}/>;
        const headerRow = ["ID", "Namespace", "Title", "Conversion Status", "Conversion Error Code", "Validation Status", "Actions"];
        const footerRow = [{colSpan: 6, as: "th", textAlign: "right", content: paginator}];
        const renderBodyRow = ({id, namespace, old, conversionStatus, conversionError, conversionIssues, validationStatus}) => ({
            key: `row-${id}`,
            warning: conversionStatus != "SUCCESS",
            cells: [
                id,
                namespace,
                old.title || "--TITLE-COULD-NOT-BE-EXTRACTED--",
                conversionStatus,
                conversionError ? conversionError.code : "--NA--",
                validationStatus || "--NOT-VALIDATED--",
                <Table.Cell key="verifyButton"><Button primary size="tiny" key="" onClick={() => this.setState({docId: id})}>Verify</Button></Table.Cell>
            ]
        });
        return (
            <Table size="small" celled headerRow={headerRow} footerRow={footerRow} renderBodyRow={renderBodyRow} tableData={this.state.docs} />   
        );
    }

    changeActivePage = (e, data) => {
        this.fetchRows(data.activePage-1);
    }

    fetchRows = (page) => {
        fetch("/api/lpd?startingOffset=" + (page*50), {headers: {"Content-Type": "application/json"}})
            .then((response) => response.json())
            .then((response) => {
                this.setState({docs: response});
            });
    }

    handleValidationResult = (status, comments) => {
        fetch(
            `/api/lpd/${this.state.docId}/validate`, 
            {
                method: "POST", 
                cache: "no-cache",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({status, comments})
            }
        ).then((response) => {
            this.setState({docId: undefined});
        });

    }

}