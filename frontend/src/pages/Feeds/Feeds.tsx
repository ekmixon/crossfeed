import React, { useCallback, useEffect, useState } from 'react';
import { Paper, makeStyles } from '@material-ui/core';
import { Pagination } from '@material-ui/lab';
import { useAuthContext } from 'context';
import { SavedSearch } from 'types';
import { Link } from 'react-router-dom';
import { Subnav } from 'components';

const Feeds = () => {
  const classes = useStyles();
  const { apiGet, apiDelete } = useAuthContext();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [pageState, setPageState] = useState({
    totalResults: 0,
    current: 1,
    resultsPerPage: 20,
    totalPages: 0
  });

  const fetchSavedSearches = useCallback(async () => {
    try {
      let res = await apiGet<{ result: SavedSearch[]; count: number }>(
        `/saved-searches/?page=${pageState.current}`
      );
      setSavedSearches(res.result);
      setPageState((pageState) => ({
        ...pageState,
        totalResults: res.count,
        totalPages: Math.ceil(pageState.totalResults / pageState.resultsPerPage)
      }));
    } catch (e) {
      console.error(e);
    }
  }, [apiGet, pageState]);

  useEffect(() => {
    fetchSavedSearches();
  }, [fetchSavedSearches]);

  const editSearch = async (id: string) => {};

  const deleteSearch = async (id: string) => {
    try {
      await apiDelete(`/saved-searches/${id}`);
      setSavedSearches(savedSearches.filter((search) => search.id !== id));
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className={classes.root}>
      <div className={classes.contentWrapper}>
        <Subnav
          items={[
            { title: 'My Saved Searches', path: '/feeds', exact: true },
            { title: 'Default Searches', path: '/feeds/default' }
          ]}
        ></Subnav>
        <div className={classes.content}>
          <div className={classes.panel}>
            {savedSearches.map((search: SavedSearch) => (
              <Link
                to={{
                  pathname: '/inventory',
                  search: search.searchPath,
                  state: {
                    search
                  }
                }}
                key={search.id}
                style={{ textDecoration: 'none' }}
              >
                <Paper
                  elevation={0}
                  classes={{ root: classes.cardRoot }}
                  aria-label="view domain details"
                >
                  <div className={classes.cardInner}>
                    <div className={classes.domainRow}>
                      <div className={classes.cardAlerts}>
                        <h4>{search.count} items</h4>
                      </div>
                      <div className={classes.cardDetails}>
                        <h3>{search.name}</h3>
                        <p>{search.searchTerm}</p>
                      </div>
                      <div className={classes.cardActions}>
                        <button
                          className={classes.button}
                          onClick={(event) => {
                            event.stopPropagation();
                            editSearch(search.id);
                          }}
                        >
                          EDIT
                        </button>
                        <button
                          className={classes.button}
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteSearch(search.id);
                          }}
                        >
                          DELETE
                        </button>
                      </div>
                    </div>
                  </div>
                </Paper>
              </Link>
            ))}
          </div>
        </div>

        <Paper classes={{ root: classes.pagination }}>
          <span>
            <strong>
              {pageState.totalResults === 0
                ? 0
                : (pageState.current - 1) * pageState.resultsPerPage + 1}{' '}
              -{' '}
              {Math.min(
                (pageState.current - 1) * pageState.resultsPerPage +
                  pageState.resultsPerPage,
                pageState.totalResults
              )}
            </strong>{' '}
            of <strong>{pageState.totalResults}</strong>
          </span>
          <Pagination
            count={pageState.totalPages}
            page={pageState.current}
            onChange={(_, page) => {
              setPageState((pageState) => ({
                ...pageState,
                page: page
              }));
              fetchSavedSearches();
            }}
            color="primary"
            size="small"
          />
        </Paper>
      </div>
    </div>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'relative',
    flex: '1',
    width: '100%',
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'stretch',
    margin: '0',
    overflowY: 'hidden'
  },
  contentWrapper: {
    position: 'relative',
    flex: '1 1 auto',
    height: '100%',
    display: 'flex',
    flexFlow: 'column nowrap',
    overflowY: 'hidden'
  },
  content: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'stretch',
    flex: '1',
    overflowY: 'hidden',
    marginTop: '2em',
    lineHeight: 1
  },
  panel: {
    position: 'relative',
    height: '100%',
    overflowY: 'auto',
    padding: '0 1rem 2rem 1rem',
    flex: '0 0 100%'
  },
  pagination: {
    height: 'auto',
    flex: 0,
    display: 'flex',
    flexFlow: 'row nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: '1rem 2rem',
    '& > span': {
      marginRight: '2rem'
    },
    '& *:focus': {
      outline: 'none !important'
    }
  },
  cardRoot: {
    cursor: 'pointer',
    boxSizing: 'border-box',
    marginBottom: '1rem',
    border: '2px solid #DCDEE0',
    '& em': {
      fontStyle: 'normal',
      backgroundColor: 'yellow'
    },
    height: 90,
    borderRadius: '5px'
  },
  cardInner: {},
  domainRow: {
    width: '100%',
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#28A0CB',
    outline: 'none',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0
  },
  row: {
    padding: '0.5rem 0',
    margin: 0
  },
  label: {
    fontSize: '0.8rem',
    color: '#71767A',
    display: 'block'
  },
  count: {
    color: theme.palette.error.light
  },
  data: {
    display: 'block',
    color: '#3D4551'
  },
  cardAlerts: {
    background: '#009BC2',
    boxSizing: 'border-box',
    borderRadius: '5px',
    width: 90,
    height: 86,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '& h4': {
      color: 'white',
      fontWeight: 400,
      fontSize: '1rem',
      wordBreak: 'break-all'
    }
  },
  cardDetails: {
    display: 'block',
    textAlign: 'left',
    width: '50%',
    '& p': {
      color: '#A9AEB1',
      fontWeight: 400,
      fontSize: '1rem',
      wordBreak: 'break-all'
    }
  },
  cardActions: {
    display: 'block',
    textAlign: 'right',
    marginRight: 100
  },
  button: {
    outline: 'none',
    border: 'none',
    background: 'none',
    color: theme.palette.secondary.main,
    margin: '0 0.2rem',
    cursor: 'pointer'
  },
  barWrapper: {
    zIndex: 101,
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    height: '100px',
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    boxShadow: ({ inpFocused }: any) =>
      inpFocused ? theme.shadows[4] : theme.shadows[1],
    transition: 'box-shadow 0.3s linear',
    marginBottom: '40px'
  },
  barInner: {
    flex: '1',
    maxWidth: 1400,
    margin: '0 auto',
    background: 'none',
    position: 'relative'
  }
}));

export default Feeds;
