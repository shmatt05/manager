import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Box, Typography, List, ListItem, Paper, Chip } from '@mui/material';
import { getTicketHistory } from '../services/api';

interface HistoryEntry {
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  userId: {
    name: string;
    email: string;
  };
  ticketData: any;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

const TicketHistory: React.FC<{ ticketId: string }> = ({ ticketId }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getTicketHistory(ticketId);
        setHistory(data);
      } catch (error) {
        setError('Failed to load ticket history');
        console.error('Failed to fetch ticket history:', error);
      }
    };

    fetchHistory();
  }, [ticketId]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Ticket History
      </Typography>
      <List>
        {history.map((entry, index) => (
          <ListItem key={index}>
            <Paper elevation={1} sx={{ p: 2, width: '100%' }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Chip 
                  label={entry.action}
                  color={getActionColor(entry.action)}
                  size="small"
                />
                <Typography variant="body2" color="textSecondary">
                  {format(new Date(entry.timestamp), 'PPpp')}
                </Typography>
                <Typography variant="body2">
                  by {entry.userId.name}
                </Typography>
              </Box>
              
              {entry.changes && entry.changes.length > 0 && (
                <Box mt={1}>
                  <Typography variant="subtitle2">Changes:</Typography>
                  <List dense>
                    {entry.changes.map((change, idx) => (
                      <ListItem key={idx}>
                        <Typography variant="body2">
                          {change.field}: {change.oldValue} → {change.newValue}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Paper>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default TicketHistory; 