import React from "react";
import PropTypes from "prop-types";

export default class Infographics extends React.Component {
    static propTypes = {
        img: PropTypes.shape({ src: PropTypes.string, srcXL: PropTypes.string }),
        title: PropTypes.string,
        float: PropTypes.oneOf(["right"])
    }

    render() {
        return (
            <React.Fragment>
                <div className="col-xs-12 col-sm-6 col-md-5 pull-right">
                    <a href="" data-toggle="modal" data-target=".bs-example-modal-lg">
                        <img className="img-responsive lazy" src={this.props.img.src} title={this.props.title}/>
                    </a>
                </div>
                <div className="modal fade bs-example-modal-lg" tabIndex="-1" role="dialog" aria-labelledby="myLargeModalLabel">
                    <div className="container">
                        <div className="close">
                            <button type="button" className="btn" data-dismiss="modal" id="closeExitBlockerModal" aria-hidden="true">Close</button>
                        </div>
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-body">
                                    <img className="img-responsive lazy" src={this.props.img.srcXL} title={this.props.title}    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>                
            </React.Fragment>
        );
    }
}