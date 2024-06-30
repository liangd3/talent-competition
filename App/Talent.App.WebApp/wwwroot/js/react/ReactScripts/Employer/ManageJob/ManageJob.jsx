import React from 'react';
import Cookies from 'js-cookie';
import { BodyWrapper, loaderData } from '../../Layout/BodyWrapper.jsx';
import { Pagination, Icon, Dropdown, Checkbox, Accordion, Form, Segment } from 'semantic-ui-react';
import { Button, Card, Grid, Label, ButtonGroup } from 'semantic-ui-react';
import moment from 'moment';

// Static options for filters and sorting in the job listings
const filterOptions = [
    { key: 'showActive', text: 'Show Active', value: 'showActive' },
    { key: 'showClosed', text: 'Show Closed', value: 'showClosed' },
    { key: 'showDraft', text: 'Show Draft', value: 'showDraft' },
    { key: 'showExpired', text: 'Show Expired', value: 'showExpired' },
    { key: 'showUnexpired', text: 'Show UnExpired', value: 'showUnexpired' },
    { key: 'all', text: 'All', value: 'all' },
];

const sortOptions = [
    { key: 'oldestfirst', text: 'Oldest First', value: 'asc' },
    { key: 'newestfirst', text: 'Newest First', value: 'desc' },
    
];

// Define the values as constants for styling the ribbon
const f = 10; // Fold size
const r = 15; // Ribbon curve
const t = 10; // Top offset

// Style configuration for job card ribbons
const ribbonStyle = {
    position: 'absolute',
    top: `${t}px`,
    right: `${-1 * f}px`,
    padding: `0 10px ${f}px 7px`,
    background: 'black',
    boxShadow: `0 ${-1 * f}px 0 inset #0005`,
    borderRadius: '5px', 
    clipPath: `polygon(
    5% 0, calc(100% - ${r}px) 0, 100% 0, 
    100% calc(100% - ${f}px), calc(100% - ${f}px) 100%, 
    calc(100% - ${f}px) calc(100% - ${f}px), 0 calc(100% - ${f}px), 
    0 50%, 0 0)`,
    color: 'white',
    fontSize: 'x-small'
};


export default class ManageJob extends React.Component {
    constructor(props) {
        super(props);
         // Configuration of the loader data
        let loader = loaderData
        loader.allowedUsers.push("Employer");
        loader.allowedUsers.push("Recruiter");

        // Initial component state
        this.state = {
            filters: [],
            sortOrder: 'desc',
            loadJobs: [],
            loaderData: loader,
            activePage: 1,
            sortBy: {
                date: "desc"
            },
            filter: {
                showActive: true,
                showClosed: false,
                showDraft: true,
                showExpired: true,
                showUnexpired: true
            },
            totalPages: 0,
            activeIndex: "",
        }
        this.loadData = this.loadData.bind(this);
        this.init = this.init.bind(this);
        this.loadNewData = this.loadNewData.bind(this);
        this.handleFilterChange = this.handleFilterChange.bind(this);
        this.handleSortChange = this.handleSortChange.bind(this);
        this.isExpired = this.isExpired.bind(this);
        this.handlePaginationChange = this.handlePaginationChange.bind(this);
        this.getButtonText = this.getButtonText.bind(this);
        this.getButtonColor = this.getButtonColor.bind(this);
        this.closeJob = this.closeJob.bind(this);
    };
    
    // Check if the job has expired
    isExpired(expiryDate) {
        if (!expiryDate) {
            console.error("expiryDate doesn't contain value")
            return false;}

        return moment(expiryDate).isBefore(moment().utc());
    }
    // Handlers for user interactions

    handlePaginationChange(e, { activePage }) {
        this.setState({ activePage: activePage }, () => {
            this.init();
        });
    }
    handleFilterChange(a, { value }) {
        // Update the filter settings based on user selections

        let newFilters = {
            showActive: false,
            showClosed: false,
            showDraft: false,
            showExpired: false,
            showUnexpired: false
        };
        if (value.length === 0) {
            newFilters = {
                showActive: true,
                showClosed: false,
                showDraft: true,
                showExpired: true,
                showUnexpired: true
            };
        } else if (value.includes('all'))
            {
            newFilters = {
            showActive: true,
            showClosed: true,
            showDraft: true,
            showExpired: true,
            showUnexpired: true
        };
            value = value.filter(x => x == "all");
        } else {
            value.forEach(element => {
                newFilters[element] = true;
            });
        }
        this.setState({  activePage: 1,filter: newFilters, filters: value }, () => {
            this.init();
        });

    };

    handleSortChange(a, { value }) {
        // Update the sorting of job listings based on user selections
        this.setState({activePage: 1,
            sortBy: {
                date: value
            }, sortOrder: value
        }, () => {
            this.init();
        });
    };

    init() {
        let loaderData = TalentUtil.deepCopy(this.state.loaderData)
        loaderData.isLoading = true;
        this.setState({ loaderData });
        this.loadData(() => {
            loaderData.isLoading = false;
            this.setState({ loaderData })
        })
    }

    componentDidMount() {
        this.init();
    };

    // Method to load job data from server
    loadData(callback) {

        const link = `https://mvptalentservicestalent.azurewebsites.net/listing/listing/getSortedEmployerJobs?showActive=${this.state.filter.showActive}&showClosed=${this.state.filter.showClosed}&showDraft=${this.state.filter.showDraft}&showExpired=${this.state.filter.showExpired}&showUnexpired=${this.state.filter.showUnexpired}&activePage=${this.state.activePage}&sortbyDate=${this.state.sortBy.date}`;
        var cookies = Cookies.get('talentAuthToken');
        // your ajax call and other logic goes here
        $.ajax({
            url: link,
            headers: {
                'Authorization': 'Bearer ' + cookies,
                'Content-Type': 'application/json'
            },
            type: "GET",
            contentType: "application/json",
            dataType: "json",
            success: function (res) {
                if (res.success == true) {
                    this.setState({ loadJobs: res.myJobs, totalPages: Math.ceil(res.totalCount / 6) }, callback);
                }
            }.bind(this),
            error: function (res, a, b) {   
                console.log(res)
                console.log(a)
                console.log(b)
            }.bind(this)
        })
    }

    loadNewData(data) {
        var loader = this.state.loaderData;
        loader.isLoading = true;
        data[loaderData] = loader;
        this.setState(data, () => {
            this.loadData(() => {
                loader.isLoading = false;
                this.setState({
                    loadData: loader
                })
            })
        });
    }

    getButtonText(job) {
        if (job.status == 1) {
            return 'Closed';
        } else {
            return this.isExpired(job.expiryDate) ? 'Expired' : 'Apply';
        }
    }

    getButtonColor(job) {
        if (job.status == 1) {
            return 'grey';
        } else if (job.status == 0 && this.isExpired(job.expiryDate)) { 
            return 'red'
        } else {
            return 'blue'
        }
        }


    closeJob(id) {
        var cookies = Cookies.get('talentAuthToken');
        $.ajax({
            url: 'https://mvptalentservicestalent.azurewebsites.net/listing/listing/closeJob',
            headers: {
                'Authorization': 'Bearer ' + cookies,
                'Content-Type': 'application/json'
            },
            dataType: 'json',
            type: "post",
            data: JSON.stringify(id),
            success: function (res) {
                if (res.success == true) {
                    this.loadData()
                    TalentUtil.notification.show(res.message, "success", null, null)
                } else {
                    TalentUtil.notification.show(res.message, "error", null, null)
                }
            }.bind(this),
            error: function (res, a, b) {
                console.log('Close job error:', res, a, b);  // Log error
            }.bind(this)
        })
    }

    render() {
        const { loadJobs } = this.state;
        return (
            <BodyWrapper reload={this.init} loaderData={this.state.loaderData}>
                <div className="ui container">
                    <h1>List of Jobs</h1>
                    <div>
                        <Grid>
                            <Grid.Row>
                                <Grid.Column width={7}>
                                    <Dropdown
                                        icon='filter'
                                        floating
                                        labeled
                                        placeholder='Filter'
                                        // fluid
                                        button
                                        className='icon'
                                        multiple
                                        selection
                                        options={filterOptions}
                                        onChange={this.handleFilterChange}
                                        value={this.state.filters}
                                    />
                                </Grid.Column>
                                <Grid.Column width={3} >
                                    <Dropdown
                                        icon="calendar alternate outline"
                                        placeholder='Sort by date'
                                        floating
                                        labeled
                                        button
                                        className='icon'
                                        fluid
                                        selection
                                        options={sortOptions}
                                        onChange={this.handleSortChange}
                                        value={this.state.sortOrder}
                                        style={{ marginLeft: '9rem' }}
                                    />
                                </Grid.Column>
                            </Grid.Row>
                        </Grid>
                        
                        <br />

                        {
                            loadJobs.length > 0 ? (
                                <div>
                                    <Card.Group>
                                        {loadJobs.map((job) => (                                            
                                            <Card key={job.id} style={{ width: '400px' }}  >
                                                {/* <div style={customRibbonStyle}><Icon name='user' /> 0</div> */}
                                                <div style={ribbonStyle}><Icon name='user' /> {job.noOfSuggestions}</div>
                                                <Card.Content>
                                                    <Card.Header>{job.title}</Card.Header>
                                                    <Card.Meta>{job.location.city}, {job.location.country} </Card.Meta>
                                                    <Card.Description style={{ maxHeight: '100px', overflow: 'auto', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
                                                        {job.summary}
                                                    </Card.Description>
                                                </Card.Content>
                                                <Card.Content extra >
                                                    {/* <Grid className="fluid">
                                            <Grid.Column width={2}> */}
                                                    <Button style={{ marginRight: '20px' }} color={this.getButtonColor(job)} size='mini' disabled={job.expired}>
                                                        {this.getButtonText(job)}
                                                    </Button>
                                                    {/* </Grid.Column> */}
                                                    {/* <Grid.Column floated='right'  width={5}> */}
                                                    <ButtonGroup>
                                                        <Button size='mini' basic color='blue' content="Close" icon="close" onClick={() => this.closeJob(job.id)}/>

                                                        <Button size='mini' basic color='blue' content="Edit" icon="edit" onClick={() => { window.location = "/EditJob/" + job.id }}/>

                                                        <Button size='mini' basic color='blue' content="Copy" icon="copy" />
                                                    </ButtonGroup>

                                                    {/* </Grid.Column>
                                        </Grid> */}
                                                </Card.Content>
                                            </Card>
                                        ))}
                                    </Card.Group>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                                        <Pagination
                                            activePage={this.state.activePage}
                                            onPageChange={this.handlePaginationChange}
                                            totalPages={this.state.totalPages}
                                            boundaryRange={1}
                                            siblingRange={1}
                                            ellipsisItem={undefined}
                                            firstItem={undefined}
                                            lastItem={undefined}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <p>No Jobs Found</p>
                            )
                        }
                    </div>
                    <br />
                </div>
            </BodyWrapper>
        )
    }
}