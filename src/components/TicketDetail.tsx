import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Grid, Chip } from '@mui/material';
import TicketHistory from './TicketHistory';
import { ITicket } from '../types/ticket';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface TicketDetailProps {
  ticketId: string;
  ticket: ITicket;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId, ticket }) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Tabs value={tabValue} onChange={handleTabChange}>
        <Tab label="Details" />
        <Tab label="History" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">{ticket.title}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">{ticket.description}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" gap={1} alignItems="center">
              <Typography variant="subtitle2">Status:</Typography>
              <Chip label={ticket.status} size="small" />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" gap={1} alignItems="center">
              <Typography variant="subtitle2">Priority:</Typography>
              <Chip label={ticket.priority} size="small" />
            </Box>
          </Grid>
          {ticket.assignedTo && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">
                Assigned To: {ticket.assignedTo}
              </Typography>
            </Grid>
          )}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">
              Created By: {ticket.createdBy}
            </Typography>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TicketHistory ticketId={ticketId} />
      </TabPanel>
    </Box>
  );
};

export default TicketDetail; 