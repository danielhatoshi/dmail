import * as React from 'react';
import { FC, Fragment, useCallback, useEffect, useState } from 'react';
import {
    useRedirect,
    Datagrid,
    DatagridProps,
    DateField,
    DateInput,
    Filter,
    FilterProps,
    Identifier,
    List,
    ListContextProvider,
    ListProps,
    NullableBooleanInput,
    NumberField,
    ReferenceInput,
    ReferenceField,
    SearchInput,
    TextField,
    TextInput,
    Pagination,
    useGetList,
    useListContext,
} from 'react-admin';
import { useSelector, useDispatch } from 'react-redux';
import { AppState } from '../types';
import { useMediaQuery, Divider, Tabs, Tab, Theme } from '@material-ui/core';
import Empty from '../components/empty'
import BulkActionButtons from '../components/BulkActionButtons'


import { makeStyles } from '@material-ui/core/styles';

import NbItemsField from './NbItemsField';
import CustomerReferenceField from '../visitors/CustomerReferenceField';
import AddressField from '../visitors/AddressField';
import MobileGrid from './MobileGrid';
import { Customer } from '../types';

const JunkFilter: FC<Omit<FilterProps, 'children'>> = props => (
    <Filter {...props}>
        <SearchInput source="q" alwaysOn />

    </Filter>
);

const useDatagridStyles = makeStyles({
    total: { fontWeight: 'bold' },
});

const tabs = [
    { id: 'junk', name: 'Junk' },
];

interface TabbedDatagridProps extends DatagridProps { }

const useGetTotals = (filterValues: any) => {
    const { total: totalJunk } = useGetList(
        'junks',
        { perPage: 1, page: 1 },
        { field: 'id', order: 'ASC' },
        { ...filterValues, status: 'junk' }
    );

    return {
        junk: totalJunk
    };
};

const TabbedDatagrid: FC<TabbedDatagridProps> = props => {
    const listContext = useListContext();
    // console.log(listContext)

    const { ids, data, filterValues, setFilters, displayedFilters } = listContext;
    const classes = useDatagridStyles();
    const isSmall = useMediaQuery('(max-width: 1280px)');
    const [junk, setJunk] = useState<Identifier[]>([] as Identifier[]);

    const totals = useGetTotals(filterValues) as any;

    useEffect(() => {
        if (ids && ids !== filterValues.status) {
            switch (filterValues.status) {
                case 'junk':
                    setJunk(ids);
                    break;
            }
        }
    }, [ids, filterValues.status]);

    const handleChange = useCallback(
        (event: React.ChangeEvent<{}>, value: any) => {
            setFilters &&
                setFilters(
                    { ...filterValues, status: value },
                    displayedFilters
                );
        },
        [displayedFilters, filterValues, setFilters]
    );

    const selectedIds = junk;

    return (
        <Fragment>
            {/* <Divider /> */}
            {isSmall ? (
                <ListContextProvider
                    value={{ ...listContext, ids: selectedIds }}
                >
                    {!Object.values(data).length ? <Empty /> : <MobileGrid {...props} ids={ids} data={data} status={filterValues.status} />}
                </ListContextProvider>
            ) : (
                <div>
                    {filterValues.status === 'junk' && (
                        <ListContextProvider
                            value={{ ...listContext, ids: junk }}
                        >
                            <Datagrid {...props} empty={<Empty />} optimized rowClick="show">
                                <TextField source="from" headerClassName={classes.total} />
                                <TextField source="subject" headerClassName={classes.total} />
                                <DateField source="date" locales="en-US" showTime headerClassName={classes.total} />
                            </Datagrid>
                        </ListContextProvider>
                    )}
                </div>
            )}
        </Fragment>
    );
};

// https://material-ui.com/zh/components/data-grid/pagination/
const PostPagination = props => {
    return (
        <Pagination rowsPerPageOptions={[10]} labelRowsPerPage={''} {...props} limit={null} />
    )
}

const JunkList: FC<ListProps> = props => {
    const emailname = useSelector((state: AppState) => state.email);
    const redirect = useRedirect();
    if (!emailname) {
        window.confirm('Pelease set Mailbox alias first');
        redirect('./settings/show/email')
    }

    return (
        <List
            {...props}
            filterDefaultValues={{
                status: 'junk',
                emailname
            }}
            sort={{ field: 'date', order: 'DESC' }}
            perPage={25}
            exporter={false}
            empty={<Empty />}
            // filters={<JunkFilter />}
            // delete MuiToolbar
            actions={false}
            pagination={<PostPagination />}
            bulkActionButtons={<BulkActionButtons />}
        >
            <TabbedDatagrid />
        </List>
    )
};

export default JunkList;
